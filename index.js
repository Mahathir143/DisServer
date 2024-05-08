const express = require("express");
const bcrypt = require('bcrypt');
const app = express();
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { error, table } = require("console");


require("dotenv").config();

const db = mysql.createPool({
    host: process.env.SERVER,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});
app.use('/upload/', express.static('./upload/'));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './upload'); // Set the destination folder
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Set the file name
    }
});

function fileToBase64(filePath) {
    try {
        // Read the file asynchronously
        const fileContent = fs.readFileSync(filePath);

        // Convert the file content to base64
        const base64Data = fileContent.toString('base64');

        return base64Data;
    } catch (error) {
        console.error('Error converting file to base64:', error.message);
        throw error;
    }
}

const upload = multer({ storage: storage });



//upload file dynamic screen
app.post('/api/InsertFileDataDynamic', upload.single('file'), (req, res) => {
    // Access the uploaded file information
    const uploadedFile = req.file;

    console.log('uploaded file:', uploadedFile);

    // Extract the filename from the original name
    const originalFileName = uploadedFile.originalname.split('.').slice(0, -1).join('.');
    // Concatenate the original name and the filename
    const combinedFileName = `${originalFileName}${uploadedFile.filename}`;

    const FullName = req.body.Form === undefined ? 'Doc' : req.body.Form;

    console.log('form', FullName);

    // Move the uploaded file to the 'uploads' folder
    const oldPath = uploadedFile.path;
    const newPath = path.join(__dirname, 'upload', combinedFileName);

    fs.rename(oldPath, newPath, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error moving the file');
        }
        console.log('file', newPath);
        res.send({ filePath: newPath, fileName: combinedFileName });
    });
});




app.get("/api/getDatabases", (req, res) => {
    const sqlGet = "SHOW DATABASES WHERE `Database` NOT IN ('configurations', 'information_schema', 'performance_schema','sys','mysql');";
    db.query(sqlGet, (error, result) => {
        res.send(result);
    });
});

app.get("/api/getDatabases_SA", (req, res) => {
    const sqlGet = "SHOW DATABASES WHERE `Database` NOT IN ('information_schema', 'performance_schema','sys','mysql');";
    db.query(sqlGet, (error, result) => {
        res.send(result);
    });
});

app.get("/api/getpermissions/:email/:schema/:table", (req, res) => {
    const { email, schema, table } = req.params;
    const sqlGet = "SELECT `create`,`read`,`update`,`delete` FROM alluserslist Where email ='" + email + "' and dbName = '" + schema + "' and `table` = '" + table + "'";
    db.query(sqlGet, (error, result) => {
        res.send(result);
    });
});

app.get("/api/getTables/:database", (req, res) => {
    const { database } = req.params;
    const sqlGet = "SELECT TABLE_COMMENT, table_name AS Tables, CASE WHEN EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = '" + database + "' AND TABLE_NAME = Tables AND COLUMN_NAME = 'Id' AND (COLUMN_KEY = 'UNI' OR COLUMN_KEY = 'PRI')) THEN 1 ELSE 0 END AS haveId FROM information_schema.tables WHERE table_schema = '" + database + "' AND TABLE_TYPE = 'BASE TABLE'";



    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching tables" });
        } else {
            res.status(200).json(result);
        }
    });
});

app.get("/api/getNonRestrictedTables/:database", (req, res) => {
    const { database } = req.params;
    const sqlGet = `SELECT tables AS Tables, type AS Type
        FROM ${process.env.CONFIG_PREFIX}configurations.tbl_restriction_view
        WHERE is_active = 1 AND \`Schema\` = '${database}'`;

    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching tables" });
        } else {
            res.status(200).json(result);
        }
    });
});

app.get("/api/getRulesTable/:database", (req, res) => {
    const { database } = req.params;
    const sqlGet = `SELECT * FROM ${database}.tbl_rules`;

    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching table" });
        } else {
            res.status(200).json(result);
        }
    });
});

app.get("/api/getViewRestrictionTable/:database", (req, res) => {
    const { database } = req.params;
    const sqlGet = `SELECT * FROM ${process.env.CONFIG_PREFIX}configurations.tbl_restriction_view WHERE \`Schema\` = '${database}'`;

    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching tables" });
        } else {
            res.status(200).json(result);
        }
    });
});

app.get("/api/getTableOthers/:database", (req, res) => {
    const { database } = req.params;
    const sqlGet = `SELECT * FROM ${database}.table_others`;

    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching tables" });
        } else {
            res.status(200).json(result);
        }
    });
});



app.get("/api/getExternalLinks/:database", (req, res) => {
    const { database } = req.params;
    const sqlGet = `SELECT * FROM ${database}.tbl_external_links where is_active =1`;


    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching external links" });
        } else {
            res.status(200).json(result);
        }
    });
});

app.get("/api/getExecutableTables/:database", (req, res) => {
    const { database } = req.params;
    const sqlGet = `SELECT * FROM ${database}.table_executable where is_active = 1`;

    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching executable tables" });
        } else {
            res.status(200).json(result);
        }
    });
});

app.get("/api/getCompanyDetails/:database", (req, res) => {
    const { database } = req.params;
    const sqlGet = `SELECT * FROM ${process.env.CONFIG_PREFIX}configurations.company_details WHERE company_name = '${database}' ;`;

    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching company details" });
        } else {
            res.status(200).json(result);
        }
    });
});


app.get("/api/getForTables2", (req, res) => {
    const { per_page, page, search, columns, sort, sortCol, tableName, schemaName } = req.query;
    console.log('sort', sort);
    console.log('sortCol', sortCol);
    const adjustedPage = parseInt(page) - 1; // Adjust the page number by subtracting 1
    const startIndex = adjustedPage * parseInt(per_page);

    console.log('start page', adjustedPage);
    console.log('items per page', per_page);
    console.log('columns', columns);

    const sqlTblLen = `SELECT COUNT(*) FROM  ${schemaName}.${tableName}`;
    db.query(sqlTblLen, (error, response) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching table count" });
            return;
        }

        const totalCount = response[0]['COUNT(*)'];

        const totalPages = Math.ceil(totalCount / per_page);
        console.log('total records', totalPages);

        let whereClause = '';
        if (search) {
            whereClause = `WHERE CONCAT(${columns}) LIKE '%${search}%'`;
        }

        let orderByClause = '';
        if (sortCol) {
            orderByClause = `ORDER BY ${sortCol} ${sort}`;
        }

        const sqlGet = `SELECT * FROM ${schemaName}.${tableName} ${whereClause} ${orderByClause} LIMIT ${startIndex}, ${per_page}`;

        db.query(sqlGet, (error, result) => {
            if (error) {
                console.log(error);
                res.status(500).json({ error: "Error fetching table data" });
                return;
            }

            // Fetch all data
            const sqlAllData = `SELECT * FROM ${schemaName}.${tableName} ${whereClause} ${orderByClause} LIMIT ${1}, ${totalCount}`;
            db.query(sqlAllData, (error, allDataResult) => {
                if (error) {
                    console.log(error);
                    res.status(500).json({ error: "Error fetching all table data" });
                    return;
                }

                res.status(200).json({
                    data: result,
                    allData: allDataResult,
                    page: adjustedPage,
                    per_page: per_page,
                    total: totalCount,
                    total_pages: totalPages
                });
            });
        });
    });
});






app.get("/api/getForTables/:tableName/:database/:startIndex/:endIndex/:columns1/:searchText", (req, res) => {
    const { database, tableName, startIndex, endIndex, columns1, searchText } = req.params;

    console.log('columns --', columns1);

    let Where = '';
    if (searchText !== undefined && searchText !== '' && columns1 !== undefined && searchText !== 'null') {

        Where = `WHERE CONCAT(${columns1}) LIKE '%${searchText}%'`;
        console.log(Where);
    }
    const sqlGet = `SELECT * FROM ${tableName}.${database} ${Where} LIMIT ${startIndex}, ${endIndex} `;

    console.log(sqlGet);


    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching table" });
        } else {
            res.status(200).json(result);

        }
    });
});


app.get("/api/getForTables3/:tableName/:database", (req, res) => {
    const { database, tableName } = req.params;


    const sqlGet = `SELECT * FROM ${tableName}.${database} `;

    console.log(sqlGet);


    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching table" });
        } else {
            res.status(200).json(result);

        }
    });
});

app.get("/api/getTableLength/:tableName/:database", (req, res) => {
    const { database, tableName, } = req.params;

    const sqlGet = `SELECT COUNT(*) FROM  ${tableName}.${database}`;
    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching table" });
        } else {
            res.status(200).json(result);

        }
    });
});
app.get("/api/getTableLength1/:tableName/:database/:columns1/:searchText", (req, res) => {
    const { database, tableName, columns1, searchText } = req.params;
    console.log(columns1);
    console.log(searchText);
    let Where = '';
    if (searchText !== undefined && searchText !== '' && columns1 !== undefined && searchText !== 'null') {

        Where = `WHERE CONCAT(${columns1}) LIKE '%${searchText}%'`;
        console.log(Where);
    }
    console.log(Where);
    const sqlGet = `SELECT COUNT(*) FROM  ${tableName}.${database} ${Where}`;
    console.log(sqlGet);
    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching table" });
        } else {
            res.status(200).json(result);
            console.log("length", result);
        }
    });
});

app.get("/api/getSearchedValue/:tableName/:database/:columns/:searchText", (req, res) => {
    const { database, tableName, columns, searchText } = req.params;
    const sqlGet = `SELECT * FROM ${tableName}.${database} WHERE CONCAT(${columns}) LIKE '%${searchText}%'`;
    console.log(sqlGet);

    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching table" });
        } else {
            res.status(200).json(result);
        }
    })
})

app.get("/api/getDetailTableData/:database/:table", (req, res) => {
    const { database, table } = req.params; // Change tableName to table
    const sqlGet = `SELECT * FROM ${database}.${table}`; // Change tableName to table
    console.log(sqlGet);

    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching detail table data" });
        } else {
            res.status(200).json(result);
        }
    });
});

app.get("/api/getdetailDependencyData/:tableName/:database/:primaryTable", (req, res) => {
    const { database, tableName, primaryTable } = req.params;
    const sqlGet = `SELECT * FROM ${tableName}.${database} Where header_table = '${primaryTable}'`;


    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching table" });
        } else {
            res.status(200).json(result);

        }
    });
});



app.get("/api/getdetailDependency/:tableName/:database", (req, res) => {
    const { database, tableName } = req.params;
    const sqlGet = `SELECT * FROM ${tableName}.${database}`;


    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching table" });
        } else {
            res.status(200).json(result);

        }
    });
});

app.get("/api/CheckProcedureParameter/:selectedProcedure", (req, res) => {
    const { selectedProcedure } = req.params;
    const sqlGet = `SELECT DISTINCT PARAMETER_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.PARAMETERS WHERE SPECIFIC_NAME = '${selectedProcedure}'`;

    console.log('sp name', selectedProcedure);

    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ message: "Error getting parameters" });
        } else {
            res.status(200).json(result);
        }
    })
})

app.get("/api/CallStoreProcedure", (req, res) => {
    const { procedureName, database, parameters } = req.query;

    let newParameters = "";

    if (parameters && parameters.length > 0) {
        // Map and format parameters only if they are defined and not empty
        newParameters = parameters.map((item) => {
            if (item.data_type === 'varchar' || item.data_type === 'char' || item.data_type === 'text') {
                // Add single quotes for varchar, char, and text data types
                return `'${item.value}'`;
            } else {
                return item.value;
            }
        }).join(', ');
    }

    const sqlGet = `CALL ${database}.${procedureName}(${newParameters})`;

    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error calling stored procedure" });
        } else {
            res.status(200).json(result);
        }
    });
});




app.delete("/api/delete/:id/:database/:table", (req, res) => {
    const { id, database, table } = req.params;
    const sqlRemove = "DELETE FROM " + database + "." + table + " WHERE id = ?";

    db.query(sqlRemove, id, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ message: "Error deleting record" });
        } else {
            if (result.affectedRows === 0) {
                res.status(404).json({ message: "record not found" });
            } else {
                res.status(200).json({ message: "record deleted successfully" });
            }
        }
    });
});

app.get("/api/getPermissionTable/:database/:id", (req, res) => {
    const { database, id } = req.params;
    const sqlGet = `SELECT * FROM ${database}.permission WHERE role_id = ${id}`;

    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching role table" });
        } else {
            res.status(200).json(result);

        }
    })
});

app.get("/api/getRoleTable/:database", (req, res) => {
    const { database } = req.params;
    const sqlGet = `SELECT * FROM ${database}.role`;

    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching role table" });
        } else {
            res.status(200).json(result);


        }
    })
});

app.get("/api/getRoles/:database/:roleCode", (req, res) => {
    const { database, roleCode } = req.params;
    const sqlGet = `SELECT * FROM ${database}.role WHERE Rolecode = '${roleCode}'`;

    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching role table" });
        } else {
            res.status(200).json(result);

        }
    })
});

app.get("/api/getUserTable/:database", (req, res) => {
    const { database } = req.params;
    const sqlGet = `SELECT A.id, A.username, A.email, A.contact_no, B.Rolename
    FROM ${database}.user AS A
    INNER JOIN ${database}.role AS B ON A.role_id = B.id`;

    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching role table" });
        } else {
            res.status(200).json(result);

        }
    })
});


app.post("/api/insertUserData", async (req, res) => {
    const { database, Username, email, password, ContactNo, roleId } = req.body;

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the user data into the database using parameterized query
        const sqlInsert = `INSERT INTO ${database}.user (username, password, email, contact_no, role_id) VALUES (?, ?, ?, ?, ?)`;

        db.query(sqlInsert, [Username, hashedPassword, email, ContactNo, roleId], (error, result) => {
            if (error) {
                console.log(error);
                res.status(500).json({ error: "error inserting data" });
            } else {
                res.status(200).json(result);
            }
        });
    } catch (hashError) {
        console.error(hashError);
        res.status(500).json({ error: "error hashing password" });
    }
}
);


app.post("/api/UpdateUserData", async (req, res) => {
    const { database, Username, email, password, ContactNo, roleId, EditUserId, EditUsername, EditEmail, EditContactNo, EditRoleId, isEditClick } = req.body;

    if (isEditClick) {
        try {
            const sqlUpdate = `UPDATE ${database}.user SET username = ?, email = ?, contact_no = ?, role_id = ? WHERE id = ?`;
            db.query(sqlUpdate, [EditUsername, EditEmail, EditContactNo, EditRoleId, EditUserId], (error, result) => {
                if (error) {
                    console.log(error);
                    res.status(500).json({ error: "error updating data" });
                } else {
                    res.status(200).json(result);
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "error updating user data" });
        }
    } else {
        try {
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert the user data into the database using parameterized query
            const sqlInsert = `INSERT INTO ${database}.user (username, password, email, contact_no, role_id) VALUES (?, ?, ?, ?, ?)`;

            db.query(sqlInsert, [Username, hashedPassword, email, ContactNo, roleId], (error, result) => {
                if (error) {
                    console.log(error);
                    res.status(500).json({ error: "error inserting data" });
                } else {
                    res.status(200).json(result);
                }
            });
        } catch (hashError) {
            console.error(hashError);
            res.status(500).json({ error: "error hashing password" });
        }
    }
});


app.post("/api/delete_and_archive", (req, res) => {
    const { database, table, valueId, columns, values, username, isTableDependent } = req.body;

    const keysArray = Object.keys(values);
    const valuesArray = Object.values(values);

    console.log("original values", values);

    console.log("Values", valuesArray);
    console.log("Columns", keysArray);
    console.log("table dependent?", isTableDependent);

    // Assuming you want to use NVARCHAR with a specific length, such as 255
    const ColumnsDtype = keysArray.map(column => `${column} NVARCHAR(255)`).join(', ');
    const newColumns = keysArray.map(column => column);
    const placeholders = Array.from({ length: newColumns.length }, () => "?").join(",");


    // Step 1: Check if the new table (existing_table_DELETE_HISTORY) exists
    const sqlCheckTable = `SHOW TABLES LIKE '${table}_DELETE_HISTORY'`;
    db.query(sqlCheckTable, (checkError, checkResult) => {
        if (checkError) {
            console.error("Error checking table existence:", checkError);
            res.status(500).send("Error checking table existence");
        } else {
            if (checkResult.length === 0) {
                // Table does not exist, create a new table (existing_table_DELETE_HISTORY)
                const sqlCreateTable = `CREATE TABLE ${table}_DELETE_HISTORY (Deleted_At DATETIME, Deleted_By NVARCHAR(255), ${ColumnsDtype});`;
                db.query(sqlCreateTable, (createError, createResult) => {
                    if (createError) {
                        console.error("Error creating new table:", createError);
                        res.status(500).send("Error creating new table");
                    } else {
                        console.log("New table created successfully:", createResult);
                        // Proceed with further logic if needed
                        insertIntoHistory();
                        deleteRow();
                    }
                });
            } else {
                console.log("New table not created ");
                // Table exists, proceed to delete a row and insert into the existing history table
                insertIntoHistory();
                deleteRow();
            }
        }
    });


    // Function to delete a row from the existing table
    function deleteRow() {
        const sqlDeleteRow = `DELETE FROM ${table} WHERE id = ${valueId}`;
        db.query(sqlDeleteRow, (deleteError, deleteResult) => {
            if (deleteError) {
                console.error("Error deleting row:", deleteError);
                res.status(500).send("Error deleting row");
            } else {
                console.log("Row deleted successfully:", deleteResult);

                const sqlInsertAction = `INSERT INTO ${database}.action_logs (action, table_name, date, user, record_id) VALUES ('delete','${table}',NOW(),'${username}', ?)`;

                db.query(sqlInsertAction, [valueId], (error, result) => {
                    if (error) {
                        console.log(error);

                    } else {
                        console.log(error);
                    }
                });
                // Proceed to insert a new row into the existing history table
                //insertIntoHistory();
            }
        });
    }

    // Function to insert a new row into the existing history table
    function insertIntoHistory() {
        const sqlInsertIntoHistory = `INSERT INTO ${table}_DELETE_HISTORY (Deleted_At, Deleted_By, ${keysArray.join(', ')}) VALUES (CURRENT_TIMESTAMP, ?, ${valuesArray.map(() => '?').join(', ')})`;

        // Assuming you have a MySQL connection object named 'db'
        db.query(sqlInsertIntoHistory, [username, ...valuesArray], (insertError, insertResult) => {
            if (insertError) {
                console.error("Error inserting into history table:", insertError);
                res.status(500).send("Error inserting into history table");
            } else {
                console.log("Data inserted into history table successfully:", insertResult);
                res.status(200).send("Row deleted, and data inserted into history table successfully");
            }
        });

    }

});


app.post("/api/delete_and_archive_dependent", (req, res) => {
    const { database, table1, table2, valueId, columns1, columns2, values1, values2, username, isTableDependent } = req.body;

    const keysArray1 = Object.keys(values1);
    const valuesArray1 = Object.values(values1);
    // Function to get values without the keys and excluding the 'id' field
    const getValuesWithoutId = (item) => {
        const { id, ...valuesWithoutId } = item;
        return Object.values(valuesWithoutId);
    };

    // Map through the array and get values without the keys and excluding 'id'
    const values2withoutID = values2.map(getValuesWithoutId);

    // Output the result
    console.log('Values without keys and excluding id:', values2withoutID);

    // Assuming you want to use NVARCHAR with a specific length, such as 255
    const ColumnsDtype1 = columns1.map(column => `${column} NVARCHAR(255)`).join(', ');
    const ColumnsDtype2 = columns2.map(column => `${column} NVARCHAR(255)`).join(', ');
    const newColumns = columns1.map(column => column);
    const placeholders = Array.from({ length: newColumns.length }, () => "?").join(",");


    // Step 1: Check if the new table (existing_table_DELETE_HISTORY) exists
    const sqlCheckTable = `SHOW TABLES LIKE '${table1}_DELETE_HISTORY'`;
    db.query(sqlCheckTable, (checkError, checkResult) => {
        if (checkError) {
            console.error("Error checking table existence:", checkError);
            res.status(500).send("Error checking table existence");
        } else {
            if (checkResult.length === 0) {
                // Table does not exist, create a new table (existing_table_DELETE_HISTORY)
                const sqlCreateTable = `CREATE TABLE ${table1}_DELETE_HISTORY (Deleted_At DATETIME, Deleted_By NVARCHAR(255), ${ColumnsDtype1});`;
                db.query(sqlCreateTable, (createError, createResult) => {
                    if (createError) {
                        console.error("Error creating new table:", createError);
                        res.status(500).send("Error creating new table");
                    } else {
                        console.log("New table created successfully:", createResult);

                        const sqlCheckTable2 = `SHOW TABLES LIKE '${table2}_DELETE_HISTORY'`;
                        db.query(sqlCheckTable2, (checkError, checkResult) => {
                            if (checkError) {
                                console.error("Error checking table existence:", checkError);
                                res.status(500).send("Error checking table existence");
                            } else {
                                if (checkResult.length === 0) {
                                    // Table does not exist, create a new table (existing_table_DELETE_HISTORY)
                                    const sqlCreateTable = `CREATE TABLE ${table2}_DELETE_HISTORY (Deleted_At DATETIME, Deleted_By NVARCHAR(255), ${ColumnsDtype2});`;
                                    db.query(sqlCreateTable, (createError, createResult) => {
                                        if (createError) {
                                            console.error("Error creating new table:", createError);
                                            res.status(500).send("Error creating new table");
                                        } else {
                                            console.log("New dependent table created successfully:", createResult);

                                            insertIntoHistory();

                                        }
                                    });
                                } else {
                                    console.log("New table not created ");
                                    // Table exists, proceed to delete a row and insert into the existing history table
                                    insertIntoHistory();

                                }
                            }
                        });
                    }
                });
            } else {
                console.log("New table not created ");
                // Table exists, proceed to delete a row and insert into the existing history table
                insertIntoHistory();

            }
        }
    });


    // Function to insert a new row into the existing history table
    function insertIntoHistory() {
        const sqlInsertIntoHistory = `INSERT INTO ${table1}_DELETE_HISTORY (Deleted_At, Deleted_By, ${keysArray1.join(', ')}) VALUES (CURRENT_TIMESTAMP, ?, ${valuesArray1.map(() => '?').join(', ')})`;

        // Assuming you have a MySQL connection object named 'db'
        db.query(sqlInsertIntoHistory, [username, ...valuesArray1], (insertError, insertResult) => {
            if (insertError) {
                console.error("Error inserting into history table:", insertError);
                res.status(500).send("Error inserting into history table");
            } else {
                console.log("Data inserted into history table successfully:", insertResult);
                //res.status(200).send("Row deleted, and data inserted into history table successfully");

                // Construct the dynamic part of the SQL query for column names
                const columnsString = columns2.join(', ');

                // Construct the placeholders for the values in the VALUES clause
                const valuesPlaceholders = values2withoutID.map(() => `(CURRENT_TIMESTAMP, 'Admin', ${Array(columns2.length).fill('?').join(', ')})`).join(', ');

                console.log(valuesPlaceholders);

                // Construct the final SQL query
                const sqlInsertIntoHistory = `INSERT INTO project_status_details_DELETE_HISTORY (Deleted_At, Deleted_By, ${columnsString}) VALUES ${valuesPlaceholders}`;

                // Flatten the values array for the query parameters
                const flattenedValues = values2withoutID.flat();

                // Assuming you have a MySQL connection object named 'db'
                db.query(sqlInsertIntoHistory, [...flattenedValues], (insertError, insertResult) => {
                    if (insertError) {
                        console.error("Error inserting into history table:", insertError);
                        res.status(500).send("Error inserting into history table");
                    } else {
                        console.log("Data inserted into history table successfully:", insertResult);
                        deleteRow();
                    }
                });
            }
        });

    }

    // Function to delete a row from the existing table
    function deleteRow() {
        const sqlDeleteRow = `DELETE FROM ${table1} WHERE id = ${valueId}`;
        db.query(sqlDeleteRow, (deleteError, deleteResult) => {
            if (deleteError) {
                console.error("Error deleting row:", deleteError);
                res.status(500).send("Error deleting row");
            } else {
                console.log("Row deleted successfully:", deleteResult);

                const sqlDeleteRow2 = `DELETE FROM ${table2} WHERE header_id = ${valueId}`;
                db.query(sqlDeleteRow2, (deleteError2, deleteResult2) => {
                    if (deleteError2) {
                        console.error("Error deleting row:", deleteError2);
                        res.status(500).send("Error deleting row");
                    } else {
                        console.log("Row deleted successfully:", deleteResult2);

                        const sqlInsertAction = `INSERT INTO ${database}.action_logs (action, table_name, date, user, record_id) VALUES ('delete','${table1}',NOW(),'${username}', ?)`;

                        db.query(sqlInsertAction, [valueId], (error, result) => {
                            if (error) {
                                console.log(error);
                                // Handle error appropriately
                                res.status(500).send("Error inserting into action_logs table");
                            } else {
                                console.log("Deleted successfully");
                                res.status(200).send("Rows deleted, and data inserted into action_logs table successfully");
                            }
                        });
                    }
                });
            }
        });
    }

});




app.get("/api/getFields/:database/:table", (req, res) => {
    const { database, table } = req.params;
    const sqlGet = `
        SELECT column_name, data_type, COLUMN_COMMENT
        FROM information_schema.columns
        WHERE table_schema = ?
        AND table_name = ?
        AND column_name NOT IN (
            SELECT COLUMN_NAME 
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = ?
            AND CONSTRAINT_NAME = 'PRIMARY'
        )`;

    db.query(sqlGet, [database, table, database, table], (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching tables" });
        } else {
            res.status(200).json(result);
        }
    });
});

app.get("/api/getDetailTable/:database/:table", (req, res) => {
    const { database, table } = req.params;
    const sqlGet = `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = ?
        AND table_name = ?
        AND column_name NOT IN (
            SELECT COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = ?
            AND CONSTRAINT_NAME = 'PRIMARY'
        )`;

    db.query(sqlGet, [database, table, database, table], (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching tables" });
        } else {
            res.status(200).json(result);
        }
    });
});

app.get("/api/getTableFields/:database/:table", (req, res) => {
    const { database, table } = req.params;
    const sqlGet = `
    SELECT column_name, data_type, column_key
    FROM information_schema.columns
    WHERE table_schema = ?
    AND table_name = ?`;

    db.query(sqlGet, [database, table, database, table], (error, result) => {

        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching tables" });
        } else {
            res.status(200).json(result);
        }
    });
});


app.get("/api/getForeignKeyDetails/:schema", (req, res) => {
    const { schema } = req.params;
    const sqlGet = `SELECT
            TABLE_NAME,
            COLUMN_NAME,
            CONSTRAINT_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
            FROM
            INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE
            TABLE_SCHEMA = '${schema}'
            AND REFERENCED_TABLE_NAME IS NOT NULL;`;
    console.log('foreign keys', sqlGet);
    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching tables" });
        } else {
            res.status(200).json(result);
        }
    });
});

app.get("/api/getRelationshipDetailsTable/:schema", (req, res) => {
    const { schema, table } = req.params;
    const sqlGet = `SELECT  primary_table, Primary_Table_Value, Primary_Table_Text, Relation_Table, Relation_Table_value, relation_dependency_value FROM ${schema}.realtionship_management`;

    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching tables" });
        } else {
            res.status(200).json(result);
        }
    });
});

app.get("/api/getRelationEditData/:schema/:primary_table/:primary_table_value", (req, res) => {
    const { schema, primary_table, primary_table_value } = req.params;
    const sqlGet = `SELECT Schema_name, primary_table, Primary_Table_Value, Primary_Table_Text, Relation_Table, Relation_Table_value, relation_dependency_value, primary_dependency_value, is_active 
                FROM ${schema}.realtionship_management WHERE primary_table = '${primary_table}' AND Primary_Table_Value = '${primary_table_value}'`;

    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching tables" });
        } else {
            res.status(200).json(result);
        }
    });
});



app.get("/api/getRelationshipDetails/:schema/:table", (req, res) => {
    const { schema, table } = req.params;
    const sqlGet = `SELECT  primary_table, Primary_Table_Value, Primary_Table_Text, Relation_Table, Relation_Table_value, relation_dependency_value FROM ${schema}.realtionship_management Where Relation_table = '${table}'`;
    console.log('relation', sqlGet);
    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching tables" });
        } else {
            res.status(200).json(result);
        }
    });
});

app.get("/api/getRelationshipDetailsDependentTable/:table", (req, res) => {
    const { table } = req.params;
    const sqlGet = "SELECT  primary_table, Primary_Table_Value, Primary_Table_Text, Relation_Table, Relation_Table_value, relation_dependency_value FROM easy_outdesk.realtionship_management Where Relation_table = '" + table + "'";
    console.log(sqlGet);
    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching tables" });
        } else {
            res.status(200).json(result);
        }
    });
});


app.get("/api/getPrimaryDataList/:database/:table/:value/:text", (req, res) => {
    debugger;
    const { database, table, value, text } = req.params;
    const sqlGet = "SELECT " + value + " As value, " + text + " As text from " + database + "." + table;
    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error fetching tables" });
        } else {
            res.status(200).json(result);
        }
    });
});

app.get("/api/checkLogin/:username/:password", async (req, res) => {
    const { username, password } = req.params;

    console.log('username:', username, 'password:', password);

    console.log('config env:', process.env.CONFIG_PREFIX);

    const storeProcedureCall = `CALL ${process.env.CONFIG_PREFIX}configurations.GenerateDynamicView`;
    db.query(storeProcedureCall, async (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error calling stored procedure" });
        } else {
            const sqlGet2 = `SELECT DISTINCT username, password,email, dbName, Rolename, Rolecode, \`table\`,\`create\`,\`read\`,\`update\`,\`delete\`  FROM ${process.env.CONFIG_PREFIX}configurations.alluserslist 
                    WHERE email = '${username}';`;

            db.query(sqlGet2, async (error, result) => {
                if (error) {
                    console.log(error);
                    res.status(500).json({ error: "Error getting username " });
                } else {
                    if (result.length === 0) {
                        res.status(500).json({ error: "User not found" });
                    } else {
                        const hashedPasswordFromDB = result[0].password;

                        try {
                            const match = await bcrypt.compare(password, hashedPasswordFromDB);

                            if (match) {
                                res.status(200).json({ isPassValid: true, result });
                            } else {
                                res.status(200).json({ isPassValid: false, error: "Password doesn't match" });
                            }
                        } catch (bcryptError) {
                            console.error("Error comparing passwords:", bcryptError);
                            res.status(500).json({ error: "Internal server error" });
                        }
                    }
                }
            });
        }

    })
});



app.get("/api/getPrimarytable/:schemaName/:primarytable/:primarytablevalue/:primarytabletext", (req, res) => {
    const { schemaName, primarytable, primarytablevalue, primarytabletext } = req.params;
    const sqlGet = `SELECT ${primarytablevalue}, ${primarytabletext} FROM ${schemaName}.${primarytable};`;


    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "error fetching primary table" });
        } else {
            res.status(200).json(result);
        }
    });
});

app.get("/api/getRolePermissionData/:database/:id", (req, res) => {
    const { database, id } = req.params;

    const sqlGet = `SELECT DISTINCT A.Rolename, A.Rolecode, B.\`table\`, B.\`create\`, B.\`read\`, B.\`update\`, B.\`delete\` 
    FROM ${database}.role AS A
    LEFT JOIN ${database}.permission AS B ON A.id = B.role_id
    WHERE A.id = ${id};`

    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error geting data" });
        } else {
            res.status(200).json(result);

        }
    })
});

app.get("/api/getRolePermissionDataByRolename/:database/:name", (req, res) => {
    const { database, name } = req.params;

    const sqlGet = `SELECT A.Rolename, A.Rolecode, B.\`table\`, B.\`create\`, B.\`read\`, B.\`update\`, B.\`delete\` 
    FROM ${database}.role AS A
    INNER JOIN ${database}.permission AS B ON A.id = B.role_id
    WHERE Rolename = '${name}';`
    console.log(sqlGet);
    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error geting data" });
        } else {
            res.status(200).json(result);

        }
    })
});

app.get("/api/getRestrictionTable", (req, res) => {
    const sqlGet = `SELECT * FROM ${process.env.CONFIG_PREFIX}configurations.tbl_restriction_view`;
    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error getting data" });
        } else {
            res.status(200).json(result);

        }
    })
});


app.get("/api/getViewRestrictions", (req, res) => {
    const sqlGet = `SELECT * FROM ${process.env.CONFIG_PREFIX}configurations.tbl_restriction_view WHERE is_active = 1`;
    db.query(sqlGet, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error getting data" });
        } else {
            res.status(200).json(result);

        }
    })
});

app.post("/api/insertRoleandPermissionData", (req, res) => {
    const { database, Rolecolumns, Rolevalues, EditroleColumns, EditroleValues, username, PermissionData, EditPermissionData, editClick, PermissionId } = req.body;

    console.log('edit permission data', EditPermissionData);
    console.log('permission id', PermissionId);


    if (!editClick) {

        const placeholders = Array.from({ length: Rolecolumns.length }, () => "?").join(",");
        const newRolenameValue = Rolevalues[0];
        const newRolecodeValue = Rolevalues[1];

        const sqlCheck = `SELECT id FROM ${database}.role WHERE Rolename = ? AND Rolecode = ?;`;

        db.query(sqlCheck, [newRolenameValue, newRolecodeValue], (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ error: "Error checking data" });
            }

            const existingRoleIds = results.map(row => row.id);

            if (existingRoleIds.length > 0) {
                // Iterate over each existing role ID
                existingRoleIds.forEach(existingRoleId => {
                    // Iterate over the PermissionData and update each record in the permission table separately
                    Object.entries(PermissionData).forEach(([tableName, operations]) => {
                        const updateStatement = `
                    UPDATE ${database}.permission
                    SET \`create\` = ${operations.create ? 1 : 0},
                        \`read\` = ${operations.read ? 1 : 0},
                        \`update\` = ${operations.edit ? 1 : 0},
                        \`delete\` = ${operations.delete ? 1 : 0}
                    WHERE role_id = ${existingRoleId} AND \`table\` = '${tableName}'`;

                        db.query(updateStatement, (error, results, fields) => {
                            if (error) throw error;
                            console.log(`Updated permission table for role ID ${existingRoleId} and table ${tableName}`);
                        });
                    });
                });

                res.status(200).json({ message: "Data updated successfully" });
            } else {
                const sqlInsert = `
                    INSERT INTO ${database}.role (${Rolecolumns.join(",")}) VALUES (${placeholders});
                `;

                db.query(sqlInsert, Rolevalues, (error, result) => {
                    if (error) {
                        console.log(error);
                        res.status(500).json({ error: "Error inserting data" });
                    } else {
                        const lastInsertedId = result.insertId;

                        const sqlInsertaction = `
                            INSERT INTO ${database}.action_logs (action, table_name, date, user, record_id) 
                            VALUES ('create', 'role', NOW(), ?, ?)
                        `;

                        db.query(sqlInsertaction, [username, lastInsertedId], (error, result) => {
                            if (error) {
                                console.log(error);
                                return res.status(500).json({ error: "Error updating action logs" });
                            } else {
                                // Iterate over the PermissionData and insert each record into the permission table
                                Object.entries(PermissionData).forEach(([tableName, operations]) => {
                                    const sqlInsertPermission = `
                                     INSERT INTO ${database}.permission (role_id, \`table\`, \`create\`, \`read\`, \`update\`, \`delete\`)
                                        VALUES (?, ?, ?, ?, ?, ?) `;

                                    // Convert boolean values to 1 or 0
                                    const permissionValues = [
                                        lastInsertedId,
                                        tableName,
                                        operations.create ? 1 : 0,
                                        operations.read ? 1 : 0,
                                        operations.update ? 1 : 0,
                                        operations.delete ? 1 : 0,
                                    ];

                                    db.query(sqlInsertPermission, permissionValues, (error, results, fields) => {
                                        if (error) throw error;
                                        console.log(`Inserted into permission table for ${tableName}`);
                                    });
                                });
                                res.status(200).json({ message: "Data inserted successfully" });
                            }
                        });
                    }
                });
            }
        });


    } else {

        const newRolenameValue = EditroleValues[0];
        const newRolecodeValue = EditroleValues[1];
        const sqlUpdateRole = `UPDATE ${database}.role SET Rolename = ?, Rolecode = ? WHERE id = ?`;

        db.query(sqlUpdateRole, [newRolenameValue, newRolecodeValue, PermissionId], (error, result) => {
            if (error) {
                console.log(error);
                res.status(500).json({ error: "Error updating role data" });
            } else {
                EditPermissionData.forEach((item) => {
                    const { table, create, read, update, delete: del } = item;

                    const sqlCheckPermission = `SELECT * FROM ${database}.permission WHERE role_id = ? AND \`table\` = ?`;
                    db.query(sqlCheckPermission, [PermissionId, table], (error, results, fields) => {
                        if (error) {
                            console.log(error);
                            throw error;
                        }

                        if (results.length > 0) {
                            // Row exists, perform update
                            const sqlUpdatePermission = `
                        UPDATE ${database}.permission
                        SET \`create\` = ?, \`read\` = ?, \`update\` = ?, \`delete\` = ?
                        WHERE role_id = ? AND \`table\` = ?
                    `;
                            db.query(sqlUpdatePermission, [create, read, update, del, PermissionId, table], (error, results, fields) => {
                                if (error) {
                                    console.log(error);
                                    throw error;
                                }
                            });
                        } else {
                            // Row does not exist, perform insert
                            const sqlInsertPermission = `
                        INSERT INTO ${database}.permission (role_id, \`table\`, \`create\`, \`read\`, \`update\`, \`delete\`)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;
                            db.query(sqlInsertPermission, [PermissionId, table, create, read, update, del], (error, results, fields) => {
                                if (error) {
                                    console.log(error);
                                    throw error;
                                }
                            });
                        }
                    });
                });

                res.status(200).json({ message: "Data updated successfully" });
            }
        });




    }
});

app.post("/api/insertRestrictionData", (req, res) => {
    const { database, username, PermissionData } = req.body;

    console.log(PermissionData);

    // Iterate over the PermissionData array
    PermissionData.forEach((tableData) => {
        const tableName = Object.keys(tableData)[0]; // Extract table name
        const operations = tableData[tableName]; // Extract operations for the current table
        const valueType = operations.type;

        // Check if the record exists
        const checkIfExistsQuery = `
            SELECT * FROM ${process.env.CONFIG_PREFIX}configurations.tbl_restriction_view
            WHERE \`Schema\` = ? AND \`type\` = ? AND tables = ?`;

        const checkIfExistsValues = [database, valueType, tableName];

        db.query(checkIfExistsQuery, checkIfExistsValues, (error, results, fields) => {
            if (error) {
                console.log(`Error checking if record exists for ${tableName}: ${error}`);
            } else {
                if (results.length > 0) {
                    // Record exists, update it
                    const updatePermissionQuery = `
                        UPDATE ${process.env.CONFIG_PREFIX}configurations.tbl_restriction_view
                        SET is_active = ?
                        WHERE \`Schema\` = ? AND \`type\` = ? AND tables = ?`;

                    const is_active_value = operations.remove ? 0 : 1;
                    const updatePermissionValues = [is_active_value, database, valueType, tableName];

                    db.query(updatePermissionQuery, updatePermissionValues, (updateError, updateResults, updateFields) => {
                        if (updateError) {
                            console.log(`Error updating permission table for ${tableName}: ${updateError}`);
                        } else {
                            console.log(`Updated permission table for ${tableName}`);
                        }
                    });
                } else {
                    // Record doesn't exist, insert a new one
                    const insertPermissionQuery = `
                        INSERT INTO ${process.env.CONFIG_PREFIX}configurations.tbl_restriction_view 
                            (\`Schema\`, \`type\`, tables, is_active) 
                        VALUES (?, ?, ?, ?)`;

                    const is_active_value = operations.remove ? 0 : 1;
                    const insertPermissionValues = [database, valueType, tableName, is_active_value];

                    db.query(insertPermissionQuery, insertPermissionValues, (insertError, insertResults, insertFields) => {
                        if (insertError) {
                            console.log(`Error inserting permission table for ${tableName}: ${insertError}`);
                        } else {
                            console.log(`Inserted permission table for ${tableName}`);
                        }
                    });
                }
            }
        });
    });

    res.status(200).json({ message: "Data inserted or updated successfully" });
});



app.post("/api/updateRestrictionData", (req, res) => {
    const { database, username, UpdatedPermissionData } = req.body;

    const id = UpdatedPermissionData.id;
    const checkedState = UpdatedPermissionData.checkedState;

    const checkedStateConvert = checkedState ? 1 : 0;

    const sqlUpdatePermission = `UPDATE ${process.env.CONFIG_PREFIX}configurations.tbl_restriction_view SET is_active = ${checkedStateConvert} WHERE id = ${id} `;

    db.query(sqlUpdatePermission, (error, result) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Error updating table view restriction" });
        } else {
            res.status(200).json({ message: "Data updated successfully", result });
        }

    })
}

);










app.post("/api/insertDatawithFile", upload.single('file'), (req, res) => {

    const { database, table, columns, values, username } = req.body;
    //const file = req.file; // This will contain information about the uploaded file
    const file = req.file;
    const newValues = values.split(',');
    const newColumns = columns.split(',');
    //console.log("file", file);

    // Handle the file on the server side, save it, and get the file path
    const filePath = file.filename;

    //values[values.length - 1] = filePath;

    const newValues1 = newValues.slice(0, -1);

    newValues1.push(filePath);

    console.log("added value", newValues1);


    // Move the uploaded file to the specified path
    fs.rename(file.path, filePath, (err) => {
        if (err) {
            console.error('Error moving file:', err);
            res.status(500).json({ error: 'Error moving file' });
        } else {

            if (!database || !table || !Array.isArray(newColumns) || !Array.isArray(newValues1)) {
                return res.status(400).json({ error: "Invalid request body format" });
            }

            if (newColumns.length !== newValues1.length) {
                return res.status(400).json({ error: "Columns and values arrays must have the same length" });
            }


            const placeholders = Array.from({ length: newColumns.length }, () => "?").join(",");
            const sqlInsert = `INSERT INTO ${database}.${table} (${newColumns.join(",")}) VALUES (${placeholders})`;
            console.log(sqlInsert);


            db.query(sqlInsert, newValues1, (error, result) => {
                if (error) {
                    console.log(error);
                    res.status(500).json({ error: "Error inserting data" });

                } else {
                    const lastInsertedId = result.insertId;

                    const sqlInsertaction = `INSERT INTO ${database}.action_logs (action, table_name, date, user, record_id) VALUES ('create','${table}',NOW(),'${username}', ${lastInsertedId})`;

                    db.query(sqlInsertaction, (error, result) => {
                        if (error) {
                            console.log(error);
                            return res.status(500).json({ error: "Error updating action logs" });
                        } else {
                            res.status(200).json({ message: "Data inserted successfully", result });
                        }

                    })
                }

            });


        }
    });



});



app.post("/api/insertData", (req, res) => {

    const { database, table, columns, values, username } = req.body;

    if (!database || !table || !Array.isArray(columns) || !Array.isArray(values)) {
        return res.status(400).json({ error: "Invalid request body format" });
    }

    if (columns.length !== values.length) {
        return res.status(400).json({ error: "Columns and values arrays must have the same length" });
    }


    const placeholders = Array.from({ length: columns.length }, () => "?").join(",");
    const sqlInsert = `INSERT INTO ${database}.${table} (${columns.join(",")}) VALUES (${placeholders})`;
    console.log(sqlInsert);


    db.query(sqlInsert, values, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error inserting data" });

        } else {
            const lastInsertedId = result.insertId;

            const sqlInsertaction = `INSERT INTO ${database}.action_logs (action, table_name, date, user, record_id) VALUES ('create','${table}',NOW(),'${username}', ${lastInsertedId})`;

            db.query(sqlInsertaction, (error, result) => {
                if (error) {
                    console.log(error);
                    return res.status(500).json({ error: "Error updating action logs" });
                } else {
                    res.status(200).json({ message: "Data inserted successfully", result });
                }

            })
        }

    });



});


app.post("/api/insertDependentData", (req, res) => {

    const { database, table1, SectableName, table1columns, table1values, Sectablecolumns, Sectablevalues, rows, username } = req.body;

    if (!database || !table1 || !Array.isArray(table1columns) || !Array.isArray(table1values)) {
        return res.status(400).json({ error: "Invalid request body format" });
    }

    if (table1columns.length !== table1values.length) {
        return res.status(400).json({ error: "Columns and values arrays must have the same length" });
    }

    const placeholders_table1 = Array.from({ length: table1columns.length }, () => "?").join(",");
    const sqlInsert1 = `INSERT INTO ${database}.${table1} (${table1columns.join(",")}) VALUES (${placeholders_table1})`;
    console.log(sqlInsert1);

    console.log(database, table1, SectableName, table1columns, table1values, Sectablecolumns, Sectablevalues, rows, username);

    db.query(sqlInsert1, table1values, (error, result) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Error inserting data" });
        }
        const lastInsertedId = result.insertId;
        console.log('Last inserted ID status header:', lastInsertedId);

        const sqlInsert_action = `INSERT INTO ${database}.action_logs (action, table_name, date, user, record_id) VALUES ('create','${table1}',NOW(),'${username}', ${lastInsertedId})`;

        db.query(sqlInsert_action, (error, result) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ error: "Error updating action logs" });
            }

            console.log("last inserted id", lastInsertedId);

            //const newTable2Values = table2values.map((value, index) => (index === 0 && value === null ? lastInsertedId : (value === null ? 'null' : "'" + value + "'")));




            //const newTable2Values = table2values.map((value) => (value === null ? 'null' : "'" + value + "'"));
            const columnsPerRow = Sectablecolumns.length / rows;
            console.log('columns', columnsPerRow);
            // Extract unique columns for each row
            const uniqueColumns = [];
            for (let i = 0; i < rows; i++) {
                const startIndex = i * columnsPerRow;
                const endIndex = startIndex + columnsPerRow;
                const rowColumns = Sectablecolumns.slice(startIndex, endIndex);

                // Extract unique columns for each row
                const uniqueRowColumns = [...new Set(rowColumns)];
                uniqueColumns.push(uniqueRowColumns);
            }


            console.log(uniqueColumns.map((item) => item));

            const valuesPerRow = uniqueColumns[0].length;
            const totalRows = valuesPerRow;
            const tblNames = SectableName.map(item => item.tbl_name);

            let query = '';
            let index = 0;
            var columns = uniqueColumns[0].join(',');
            const queries = [];

            for (let i = 0; i < rows; i++) {
                const startIndex = i * totalRows;
                const endIndex = startIndex + totalRows;
                // Extract the row values for the current set
                const rowValues = Sectablevalues.slice(startIndex, endIndex);

                //console.log('row values', rowValues);



                // Replace the first null with lastInsertedId
                const indexOfNull = rowValues.indexOf(null);
                if (indexOfNull !== -1) {
                    rowValues[indexOfNull] = lastInsertedId;
                }


                // Extract the columns for the current set
                const currentColumns = uniqueColumns[i];
                const currentDatabase = tblNames[i];


                // Construct the query using parameterized values
                const queryValues = rowValues.map(value => (value === null ? 'null' : `'${value}'`));
                const currentQuery = `INSERT INTO ${database}.${currentDatabase} (${currentColumns.join(',')}) VALUES (${queryValues.join(',')});`;


                queries.push(currentQuery);
                console.log("queries", queries);
            }


            Promise.all(
                queries.map((query) => {
                    return new Promise((resolve, reject) => {
                        db.query(query, (error, result) => {
                            if (error) {
                                console.error(error);
                                reject(`Error executing query: ${query}`);
                            } else {
                                resolve(result);
                                /* const LastInsertId = result.insertId;
                                const sqlInsert_action = `INSERT INTO ${database}.action_logs (action, table_name, date, user, record_id) VALUES ('create','${table2}',NOW(),'${username}', ${LastInsertId})`;

                                db.query(sqlInsert_action, (error, result) => {
                                    if (error) {
                                        console.log(error);
                                        return res.status(500).json({ error: "Error updating action logs" });
                                    }

                                }) */
                            }
                        });
                    });
                })
            )
                .then((results) => {
                    res.status(200).json({ message: "Data inserted successfully", results });
                })
                .catch((error) => {
                    console.error(error);
                    res.status(500).json({ error: "Error inserting data" });
                });

        });


    });
});




app.post("/api/updateDependentData", (req, res) => {
    const { database, table1, table2, table1columns, table1values, table1valueId, table2columns, table2values, table2valuesId, rows, username, recordId } = req.body;

    console.log("table1", table1);
    console.log("table1 columns", table1columns);
    console.log("table1 values", table1values);
    console.log("table1 value id", table1valueId);

    console.log("table2", table2);
    console.log("table2 columns", table2columns);
    console.log("table2 values", table2values);
    console.log("table 2 value id", table2valuesId);

    const table2WithoutId = table2values.map(({ id, ...rest }) => rest);

    console.log(table2WithoutId);

    /* 
        if (!database || !table1 || !Array.isArray(table1columns) || !Array.isArray(table1values)) {
            return res.status(400).json({ error: "Invalid request body format" });
        }
    
        if (table1columns.length !== table1values.length) {
            return res.status(400).json({ error: "Columns and values arrays must have the same length" });
        } */

    const sqlUpdate1 = `UPDATE ${database}.${table1} SET ${table1columns.map(col => `${col} = ?`).join(',')} WHERE id = ${table1valueId}`;
    //const table1ValuesWithId = [...table1values, table1valueId];

    console.log(sqlUpdate1);
    db.query(sqlUpdate1, table1values, (error, result) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Error updating data" });
        }

        const sqlUpdate_action = `INSERT INTO ${database}.action_logs (action, table_name, date, user, record_id) VALUES ('update','${table1}',NOW(),'${username}', ${table1valueId})`;

        db.query(sqlUpdate_action, (error, result) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ error: "Error updating action logs" });
            }

            queries = [];

            table2valuesId.map((item) => {
                // Find the corresponding rowValue for the current item.id
                const rowValue = table2values.find((row) => row.id === item);

                if (rowValue) {
                    const sqlUpdate2 = `UPDATE ${database}.${table2} SET ${table2columns
                        .map((col) => `${col} = '${rowValue[col]}'`)
                        .join(',')} WHERE id = ${item}`;

                    queries.push(sqlUpdate2);
                    console.log(sqlUpdate2);
                }
            });

            Promise.all(
                queries.map((query) => {
                    return new Promise((resolve, reject) => {
                        db.query(query, (error, result) => {
                            if (error) {
                                console.error(error);
                                reject(`Error executing query: ${query}`);
                            } else {
                                resolve(result);

                                /* const sqlInsert_action = `INSERT INTO ${database}.action_logs (action, table_name, date, user, record_id) VALUES ('update','${table2}',NOW(),'${username}', ${table2valuesId})`;

                                db.query(sqlInsert_action, (error, result) => {
                                    if (error) {
                                        console.log(error);
                                        return res
                                            .status(500)
                                            .json({ error: "Error updating action logs" });
                                    }
                                }); */
                            }
                        });
                    });
                })
            )
                .then((results) => {
                    res
                        .status(200)
                        .json({ message: "Data inserted successfully", results });
                })
                .catch((error) => {
                    console.error(error);
                    res.status(500).json({ error: "Error inserting data" });
                });


        });
    });
});

app.post("/api/insertExtraRelationdata", (req, res) => {
    const { SelectedSchema, relationship_table_data } = req.body;

    console.log('RELATIONSHIP DATA', relationship_table_data);

    const sqlInsert = `INSERT INTO realtionship_management (primary_table, Primary_Table_Text, Primary_Table_Value, Relation_Table, Relation_Table_value, Schema_name)
    SELECT
        REFERENCED_TABLE_NAME AS primary_table,
        'Name' AS Primary_Table_Text,
        REFERENCED_COLUMN_NAME AS Primary_Table_Value,
        TABLE_NAME AS Relation_Table,
        COLUMN_NAME AS Relation_Table_value,
        '${SelectedSchema}' AS Schema_name
    FROM
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS kcu
    LEFT JOIN
        easy_outdesk.realtionship_management AS rm ON kcu.REFERENCED_TABLE_NAME = rm.primary_table AND kcu.TABLE_NAME = rm.Relation_Table AND kcu.COLUMN_NAME = rm.Relation_Table_value
    WHERE
        kcu.TABLE_SCHEMA = '${SelectedSchema}'
        AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
        AND kcu.CONSTRAINT_NAME IN (
            SELECT CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
            WHERE CONSTRAINT_TYPE = 'FOREIGN KEY'
        )
        AND rm.Id IS NULL`;

    db.query(sqlInsert, (error, result) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Error inserting data" });
        }

        res.status(200).json({ message: "Data inserted successfully", result });
    });
});

app.post("/api/insertAndUpdateRelationdata", (req, res) => {
    const { SelectedSchema, relationship_table_data, isDatathere, EditData } = req.body;

    console.log('relationdata', relationship_table_data);
    console.log('editRelationData', EditData);


    function findExtraItems(relationship_table_data, EditData) {
        const extraItems = [];

        // Convert EditData to a set of objects for efficient lookup
        const editRelationDataSet = new Set(EditData.map(item => JSON.stringify({ Relation_Table: item.Relation_Table, Relation_Table_value: item.Relation_Table_value })));

        // Filter out items from relationship_table_data that are not present in EditData
        relationship_table_data.forEach(item => {
            const key = JSON.stringify({ Relation_Table: item.Relation_Table, Relation_Table_value: item.Relation_Table_value });
            if (!editRelationDataSet.has(key)) {
                extraItems.push(item);
            }
        });

        return extraItems;
    }

    const InsertDataItems = findExtraItems(relationship_table_data, EditData);
    console.log('insert data', InsertDataItems);



    function findUncommonItems(relationData, editRelationData) {
        const uncommonItems = [];

        // Convert editRelationData to a set of objects for efficient lookup
        const editRelationDataSet = new Set(editRelationData.map(item => JSON.stringify({
            Relation_Table: item.Relation_Table,
            Relation_Table_value: item.Relation_Table_value
        })));

        // Convert relationData to a set of objects for efficient lookup
        const relationDataSet = new Set(relationData.map(item => JSON.stringify({
            Relation_Table: item.Relation_Table,
            Relation_Table_value: item.Relation_Table_value
        })));

        // Find items in editRelationData that are not present in relationData
        editRelationData.forEach(item => {
            const key = JSON.stringify({
                Relation_Table: item.Relation_Table,
                Relation_Table_value: item.Relation_Table_value
            });
            if (!relationDataSet.has(key)) {
                item.is_active = '0'
                uncommonItems.push(item);
            }
        });


        return uncommonItems;
    }

    const RemovedItems = findUncommonItems(relationship_table_data, EditData);



    const filteredRelationData = relationship_table_data.filter(relationItem => {
        return !InsertDataItems.some(insertItem =>
            relationItem.Relation_Table === insertItem.Relation_Table &&
            relationItem.Relation_Table_value === insertItem.Relation_Table_value &&
            relationItem.relation_dependency_value === insertItem.relation_dependency_value &&
            relationItem.primary_dependency_value === insertItem.primary_dependency_value
        );
    });
    console.log('Removed Items:', RemovedItems);

    const combinedUpdateData = [...filteredRelationData, ...RemovedItems];
    console.log('combined update Data:', combinedUpdateData);


    combinedUpdateData.map(item => {
        let sql = `
            UPDATE ${SelectedSchema}.realtionship_management 
            SET is_active = '${item.is_active}', primary_dependency_value = '${item.primary_dependency_value}'`;

        // If primary_table_text is provided, include it in the update query
        if (item.primary_table_text !== undefined && item.primary_table_text !== null && item.primary_table_text !== '') {
            sql += `, Primary_Table_Text = '${item.primary_table_text}'`;
        }

        sql += `
            WHERE primary_table = '${item.primary_table}' 
            AND relation_table = '${item.Relation_Table}' 
            AND relation_table_value = '${item.Relation_Table_value}'`;

        console.log('update Data', sql);

        db.query(sql, (error, results) => {
            if (error) throw error;
            console.log(`Updated ${results.affectedRows} rows`);
        });
    });

    if (InsertDataItems) {
        const sqlInsert = `INSERT INTO ${SelectedSchema}.realtionship_management (primary_table, Primary_Table_Text, Primary_Table_Value, Relation_Table, Relation_Table_value, relation_dependency_value, Schema_name, primary_dependency_value) VALUES ?`;
        const values = InsertDataItems.map(row => [row.primary_table, row.primary_table_text, row.primary_table_value, row.Relation_Table, row.Relation_Table_value, row.relation_dependency_value, row.schema_name, row.primary_dependency_value]);

        db.query(sqlInsert, [values], (error, result) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ error: "Error inserting data" });
            }

            res.status(200).json({ message: "Data inserted successfully", result });
        });
    }


});

app.post("/api/insertRelationdata", (req, res) => {
    const { SelectedSchema, relationship_table_data } = req.body;
    const sqlInsert = `INSERT INTO ${SelectedSchema}.realtionship_management (primary_table, Primary_Table_Text, Primary_Table_Value, Relation_Table, Relation_Table_value, relation_dependency_value, Schema_name, primary_dependency_value) VALUES ?`;
    const values = relationship_table_data.map(row => [row.primary_table, row.primary_table_text, row.primary_table_value, row.relation_table, row.relation_table_value, row.relation_dependency_value, row.schema_name, row.primary_dependency_value]);

    db.query(sqlInsert, [values], (error, result) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Error inserting data" });
        }

        res.status(200).json({ message: "Data inserted successfully", result });
    });
});

app.post("/api/updateRecords", (req, res) => {
    console.log("req body", req.body);
    const { database, table, columns, values, username, valueId } = req.body;

    // Filter out null values from both columns and values
    const nonNullColumns = columns.filter((col, index) => values[index] !== null);
    const nonNullValues = values.filter(val => val !== null);

    // If both arrays are empty, there's nothing to update
    if (nonNullColumns.length === 0 || nonNullValues.length === 0) {
        return res.status(400).json({ error: "No valid columns or values to update" });
    }

    const setValues = nonNullColumns.map((column) => `${column} = ?`).join(", ");

    // Use a parameterized query to avoid SQL injection
    const sqlUpdate = `UPDATE ${database}.${table} SET ${setValues} WHERE id = ${valueId}`;
    console.log(sqlUpdate);

    console.log("values", nonNullValues);
    console.log(nonNullColumns);
    console.log(sqlUpdate);

    db.query(sqlUpdate, nonNullValues, (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Error updating data" });
        } else {
            const lastInsertedId = result.insertId;

            const sqlInsertAction = `INSERT INTO ${database}.action_logs (action, table_name, date, user, record_id) VALUES ('update','${table}',NOW(),'${username}', ?)`;

            db.query(sqlInsertAction, [valueId], (error, result) => {
                if (error) {
                    console.log(error);
                    return res.status(500).json({ error: "Error updating action logs" });
                } else {
                    res.status(200).json({ message: "Data updated successfully", result });
                }
            });
        }
    });
});

app.get("/api/getTableComments/:schema/:tableName", (req, res) => {

    const { schema, tableName } = req.params;

    const sqlGet = `SELECT table_comment FROM INFORMATION_SCHEMA.TABLES WHERE table_schema='${schema}' AND table_name='${tableName}'`
    db.query(sqlGet, (error, result) => {
        res.send(result);
    });
});






var port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}...`);
});