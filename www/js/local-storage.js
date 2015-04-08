function generateId() {
    // used to generate Ids for user & projects
    var id = uuid.v1();
    return id;
}

function getUserId() {
    var id = null;
    if (!localStorage.userId) {
        localStorage.userId = generateId();
    }
    id = localStorage.userId; 
    console.log("userId: " + id);
    return id;
}

function addProject(projName, projVersion, iconPath, projDir) {
    var id = generateId();
    var projectObj = {};
    projectObj.id = id;
    projectObj.projDir = projDir;
    projectObj.projName = projName;

    if (localStorage["projects"]) {
        // retrieve exsiting projects to appending a new project
        var projects = JSON.parse(localStorage["projects"]);        
        projects.push(projectObj);      
        localStorage["projects"] = JSON.stringify(projects);   
        console.log(JSON.stringify(projects));    
    } else {
        var myProjects = new Array();
        myProjects.push(projectObj);        
        localStorage["projects"] = JSON.stringify(myProjects);
        console.log(JSON.stringify(myProjects));
    }

    // render newly added project to GUI & set it as the active widget
    addProjectWidget(id, projName, projVersion, iconPath, projDir);
    setActiveWidget(id, projDir);
}

function getProjects() {
    if (localStorage["projects"]) {

        var projects = JSON.parse(localStorage["projects"]);
        var index = projects.length;

        console.log(JSON.stringify(projects));
        
        global.jQuery.each(projects, function(idx, project) {
            var projDir = project.projDir;
            var id = project.id;
                       
            fs.exists(projDir, function(exists) {
                if (exists) {
                    getProjectConfig(id, projDir, idx);
                } else {
                    // project folder not found...store the IDs to be removed from localStorage
                    missingId(id);
                }               
            });            
        });
        
        setTimeout(removeMissingProjects, 1000);
    }
}

function missingId(id) {
    global.missing.push(id);
}

function removeMissingProjects() {
    console.log(global.missing.length);
    
    var projects = JSON.parse(localStorage["projects"]);        
    var index = projects.length;
    var missing = global.missing;
    
    for (var j=0;j<missing.length;j++) {
        
        var currentId = missing[j];
            
        for (var i=0;i<index;i++) {        
            var id = projects[i].id;
            if (id == currentId) {
                projects.splice(i, 1);
                index = projects.length;
                break;
            }
        }    
    }
    
    localStorage["projects"] = JSON.stringify(projects);
  
    console.log(JSON.stringify(projects)); 
    
    // if there are still projects remaining, set an active widget
    if (index > 0) {
        setActiveWidget(projects[0].id, projects[0].projDir);
    } 
    
}

function getProjectConfig(id, projDir, i) {
    
    var oldPathToConfigFile = projDir + buildPathBasedOnOS("/www/config.xml");
    var newPathToConfigFile = projDir + buildPathBasedOnOS("/config.xml");
    
    fs.readFile(newPathToConfigFile, 'utf8', function(err, data) {
        if (err) {
            fs.readFile(oldPathToConfigFile, 'utf8', function(err, data) {
                if (err) {
                    console.log("config.xml not found in: " + oldPathToConfigFile + " or " + newPathToConfigFile); 
                    displayErrorMessage("config.xml not found in: " + oldPathToConfigFile + " or " + newPathToConfigFile);
                } else {
                    parseConfigForRendering(data, id, projDir, i);
                }
            });            
        } else {
            parseConfigForRendering(data, id, projDir, i);
        }
    });

}

function parseConfigForRendering(data, id, projDir, i) {
    var iconPath = projDir + buildPathBasedOnOS("/www/");

    global.jQuery.xmlDoc = global.jQuery.parseXML(data);
    global.jQuery.xml = global.jQuery(global.jQuery.xmlDoc);

    // get the project name
    var projectName = global.jQuery.xml.find("name").text();

    // get the project version
    var projectVersion = global.jQuery.xml.find("widget").attr("version");

    // get the app icon
    var projectIcon = global.jQuery.xml.find("icon").attr("src");
    iconPath += projectIcon;

    addProjectWidget(id, projectName, projectVersion, iconPath, projDir);

    if (i == 0) {
        setActiveWidget(id, projDir);            
    }    
}

function removeProjectById(currentId) {

    // retrieve exsiting projects to find the project to remove
    var projects = JSON.parse(localStorage["projects"]);        
    var index = projects.length;
    
    for (var i=0;i<index;i++) {
        
        var id = projects[i].id;
        
        if (id == currentId) {
            projects.splice(i, 1);
            break;
        }
    }
    
    localStorage["projects"] = JSON.stringify(projects);
  
    console.log(JSON.stringify(projects));  
        
    index = projects.length;
    
     // set new active widget if there are still projects, otherwise disable the remove button
    if (index > 0) {
        setActiveWidget(projects[0].id, projects[0].projDir);       
    } else {
        disableMinusButton();
        global.jQuery("#status-field").hide();
        global.jQuery("#guide-add").show();
        serverOfflineState();
    }
   
}

function updateProjectNameInLocalStorage(id, projectName) {
    if (localStorage["projects"]) {
        var projects = JSON.parse(localStorage["projects"]);

        for (var i = 0; i < projects.length; i++) {
            if (id === projects[i].id) {
                projects[i].projName = projectName;
                break;
            }
        }

        localStorage["projects"] = JSON.stringify(projects);
    }
}