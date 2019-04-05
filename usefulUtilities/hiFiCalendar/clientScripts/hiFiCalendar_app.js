// hiFiCalendar_app.js
//
//  Created by Mark Brosche on 4-2-2019
//  Copyright 2019 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html

(function() {

    function targetIDDiscriminator(targetEntityID, data) {
        var tempData={};
        targetEntityID.forEach(function(entityID) {
            tempData = Entities.getEntityProperties(entityID, ['id','type']);
            if (tempData.type === "Text") {
                console.log("found the right entity", tempData.name, tempData.id, data.room);
                if (!data.start) {
                    Entities.callEntityServerMethod( tempData.id, "addEvent");
                } else {
                    Entities.callEntityServerMethod( tempData.id, "addEvent", [data.summary, data.start, data.end]);
                }
            }
        });
    }
    
    
    // This function decides how to handle web events from the tablet UI.
    // used by 'ui' in startup()
    var ORIGIN = {x:3.16949,y:893.52,z:18.6618};
    var RADIUS = 500;
    var targetEntityID;
    function onWebMessage(data) {
        // EventBridge message from HTML script.
        switch (data.type) {
            case "EVENT_BRIDGE_OPEN_MESSAGE":
                break;
            case "SEND_SCHEDULE":
                targetEntityID = Entities.findEntitiesByName(data.room, ORIGIN, RADIUS);
                targetEntityID = targetIDDiscriminator(targetEntityID, data);
                break;
        }
    }


    var FIVE_SEC_MS = 1000;
    var lastRequestTime = new Date();
    var messageHandler = function (channel, message, senderUUID, localOnly) {
        if (channel !== "HiFi.GoogleCalendar") {
            return;
        } else {
            try {
                message = JSON.parse(message);
            } catch (e) {
                console.log(e, "failed parsing message");
                return;
            }
        }
        // Notify the chosen recipient
        var now = new Date();
        if (message.type === 'schedule request' && now - lastRequestTime > FIVE_SEC_MS) { 
            ui.sendToHtml({
                type: "UPDATE_SCHEDULE"
            });
            lastRequestTime = now;
        }
    };


    // This function loads appui and connects to the needed signals
    var AppUi = Script.require('appUi');
    var ui;
    function startup() {
        ui = new AppUi({
            home: "http://localhost/hiFiCalendar.html?v32",
            buttonName: "GCAL", // The name of your app
            graphicsDirectory: Script.resolvePath("./resources/images/"), // Where your button icons are located
            onMessage: onWebMessage
        });       
        Script.scriptEnding.connect(scriptEnding);
        Messages.subscribe("HiFi.GoogleCalendar");
        Messages.messageReceived.connect(messageHandler);
    }
    startup();


    function scriptEnding() {
        Messages.unsubscribe("HiFi.GoogleCalendar");
        Messages.messageReceived.disconnect(messageHandler);
    }
})();    
