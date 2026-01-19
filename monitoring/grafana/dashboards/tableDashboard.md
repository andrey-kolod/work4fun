[ { "datasource": { "type": "loki", "uid": "Loki" }, "fieldConfig": { "defaults": { "color": {
"mode": "thresholds" }, "custom": { "align": "center", "displayMode": "color-background" },
"mappings": [], "thresholds": { "mode": "absolute", "steps": [ { "color": "rgba(34, 197, 94, 0.1)",
"value": null }, { "color": "rgba(234, 179, 8, 0.3)", "value": 1 }, { "color": "rgba(239, 68, 68,
0.5)", "value": 5 }, { "color": "rgba(239, 68, 68, 0.7)", "value": 10 } ] }, "unit": "none" },
"overrides": [ { "matcher": { "id": "byFrameRefID", "options": "A" }, "properties": [ { "id":
"color", "value": { "mode": "fixed", "fixedColor": "rgba(239, 68, 68, 0.2)" } } ] }, { "matcher": {
"id": "byFrameRefID", "options": "B" }, "properties": [ { "id": "color", "value": { "mode": "fixed",
"fixedColor": "rgba(245, 158, 11, 0.2)" } } ] } ] }, "gridPos": { "h": 4, "w": 24, "x": 0, "y": 42
}, "id": 100, "options": { "footer": { "countRows": false, "fields": "", "reducer": [ "sum" ],
"show": false }, "showHeader": true, "cellHeight": "sm" }, "targets": [ { "datasource": { "type":
"loki", "uid": "Loki" }, "editorMode": "code", "expr": "sum by (level)
(count*over_time({service_name=\"work4fun\", level=~\"ERROR|WARN\"}[5m]))", "format": "table",
"instant": true, "legendFormat": "{{level}}", "refId": "A" }, { "datasource": { "type": "loki",
"uid": "Loki" }, "editorMode": "code", "expr": "sum by (level)
(count_over_time({service_name=\"work4fun\", level=~\"ERROR|WARN\"}[1h]))", "format": "table",
"instant": true, "legendFormat": "{{level}}", "refId": "B" }, { "datasource": { "type": "loki",
"uid": "Loki" }, "editorMode": "code", "expr": "sum by (level)
(count_over_time({service_name=\"work4fun\", level=~\"ERROR|WARN\"}[6h]))", "format": "table",
"instant": true, "legendFormat": "{{level}}", "refId": "C" }, { "datasource": { "type": "loki",
"uid": "Loki" }, "editorMode": "code", "expr": "sum by (level)
(count_over_time({service_name=\"work4fun\", level=~\"ERROR|WARN\"}[24h]))", "format": "table",
"instant": true, "legendFormat": "{{level}}", "refId": "D" }, { "datasource": { "type": "loki",
"uid": "Loki" }, "editorMode": "code", "expr": "sum by (level)
(count_over_time({service_name=\"work4fun\", level=~\"ERROR|WARN\"}[7d]))", "format": "table",
"instant": true, "legendFormat": "{{level}}", "refId": "E" }, { "datasource": { "type": "loki",
"uid": "Loki" }, "editorMode": "code", "expr": "sum by (level)
(count_over_time({service_name=\"work4fun\", level=~\"ERROR|WARN\"}[30d]))", "format": "table",
"instant": true, "legendFormat": "{{level}}", "refId": "F" } ], "title": "📊 Error & Warning
Timeline", "transformations": [ { "id": "merge", "options": {} }, { "id": "organize", "options": {
"excludeByName": {}, "indexByName": { "level": 0, "Value #A": 1, "Value #B": 2, "Value #C": 3,
"Value #D": 4, "Value #E": 5, "Value #F": 6 }, "renameByName": { "level": "Level", "Value #A": "5
minutes", "Value #B": "1 hour", "Value #C": "6 hours", "Value #D": "24 hours", "Value #E": "7 days",
"Value #F": "30 days" } } } ], "type": "table" }, { "datasource": { "type": "loki", "uid": "Loki" },
"fieldConfig": { "defaults": { "color": { "mode": "fixed" }, "custom": { "hideFrom": { "legend":
false, "tooltip": false, "viz": false } }, "decimals": 0, "mappings": [], "thresholds": { "mode":
"absolute", "steps": [ { "color": "green", "value": null }, { "color": "#EAB308", "value": 1 }, {
"color": "red", "value": 10 } ] }, "unit": "none" }, "overrides": [ { "matcher": { "id": "byRegexp",
"options": "ERROR.*" }, "properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor":
"#EF4444" } }, { "id": "displayName", "value": "${__field.name}" } ] }, { "matcher": { "id":
"byRegexp", "options": "WARN.\_" }, "properties": [ { "id": "color", "value": { "mode": "fixed",
"fixedColor": "#F59E0B" } }, { "id": "displayName", "value": "${__field.name}" } ] } ] }, "gridPos":
{ "h": 12, "w": 24, "x": 0, "y": 42 }, "id": 100, "options": { "displayMode": "gradient",
"maxVizWidth": 200, "minVizHeight": 8, "minVizWidth": 0, "orientation": "horizontal",
"reduceOptions": { "calcs": [ "lastNotNull" ], "values": false }, "showUnfilled": true, "text": {
"titleSize": 12, "valueSize": 11 } }, "targets": [ { "datasource": { "type": "loki", "uid": "Loki"
}, "editorMode": "code", "expr": "label_replace(sum(count_over_time({service_name=\"work4fun\",
level=\"ERROR\"}[5m])), \"metric\", \"ERR 5min\", \"\", \"\")", "legendFormat": "", "refId": "A" },
{ "datasource": { "type": "loki", "uid": "Loki" }, "editorMode": "code", "expr":
"label_replace(sum(count_over_time({service_name=\"work4fun\", level=\"WARN\"}[5m])), \"metric\",
\"WARN 5min\", \"\", \"\")", "legendFormat": "", "refId": "B" }, { "datasource": { "type": "loki",
"uid": "Loki" }, "editorMode": "code", "expr":
"label_replace(sum(count_over_time({service_name=\"work4fun\", level=\"ERROR\"}[1h])), \"metric\",
\"ERR 1h\", \"\", \"\")", "legendFormat": "", "refId": "C" }, { "datasource": { "type": "loki",
"uid": "Loki" }, "editorMode": "code", "expr":
"label_replace(sum(count_over_time({service_name=\"work4fun\", level=\"WARN\"}[1h])), \"metric\",
\"WARN 1h\", \"\", \"\")", "legendFormat": "", "refId": "D" }, { "datasource": { "type": "loki",
"uid": "Loki" }, "editorMode": "code", "expr":
"label_replace(sum(count_over_time({service_name=\"work4fun\", level=\"ERROR\"}[6h])), \"metric\",
\"ERR 6h\", \"\", \"\")", "legendFormat": "", "refId": "E" }, { "datasource": { "type": "loki",
"uid": "Loki" }, "editorMode": "code", "expr":
"label_replace(sum(count_over_time({service_name=\"work4fun\", level=\"WARN\"}[6h])), \"metric\",
\"WARN 6h\", \"\", \"\")", "legendFormat": "", "refId": "F" }, { "datasource": { "type": "loki",
"uid": "Loki" }, "editorMode": "code", "expr":
"label_replace(sum(count_over_time({service_name=\"work4fun\", level=\"ERROR\"}[24h])), \"metric\",
\"ERR 24h\", \"\", \"\")", "legendFormat": "", "refId": "G" }, { "datasource": { "type": "loki",
"uid": "Loki" }, "editorMode": "code", "expr":
"label_replace(sum(count_over_time({service_name=\"work4fun\", level=\"WARN\"}[24h])), \"metric\",
\"WARN 24h\", \"\", \"\")", "legendFormat": "", "refId": "H" } ], "title": "📊 Error & Warning
Timeline", "type": "bargauge" }, { "datasource": { "type": "loki", "uid": "Loki" }, "fieldConfig": {
"defaults": { "color": { "mode": "thresholds" }, "custom": { "align": "left", "hideFrom": {
"legend": false, "tooltip": false, "viz": false } }, "decimals": 0, "mappings": [], "thresholds": {
"mode": "absolute", "steps": [ { "color": "#a7f3d0", "value": null }, { "color": "#fde68a", "value":
1 }, { "color": "#fca5a5", "value": 10 } ] }, "unit": "none" }, "overrides": [ { "matcher": { "id":
"byFrameRefID", "options": "A" }, "properties": [ { "id": "color", "value": { "mode": "fixed",
"fixedColor": "#e04c4c" } }, { "id": "displayName", "value": "ERROR" } ] }, { "matcher": { "id":
"byFrameRefID", "options": "B" }, "properties": [ { "id": "color", "value": { "mode": "fixed",
"fixedColor": "#e0714c" } }, { "id": "displayName", "value": "WARN" } ] } ] }, "gridPos": { "h": 3,
"w": 24, "x": 0, "y": 42 }, "id": 101, "options": { "displayMode": "gradient", "maxVizWidth": 200,
"minVizHeight": 1, "minVizWidth": 0, "orientation": "horizontal", "reduceOptions": { "calcs": [
"lastNotNull" ], "values": false }, "showUnfilled": true, "text": { "titleSize": 10, "valueSize": 7
} }, "targets": [ { "datasource": { "type": "loki", "uid": "Loki" }, "editorMode": "code", "expr":
"sum(count_over_time({service_name=\"work4fun\", level=\"ERROR\"}[5m]))", "hide": false,
"legendFormat": "", "refId": "A" }, { "datasource": { "type": "loki", "uid": "Loki" }, "editorMode":
"code", "expr": "sum(count_over_time({service_name=\"work4fun\", level=\"WARN\"}[5m]))", "hide":
false, "legendFormat": "", "refId": "B" } ], "title": "5 minutes:", "type": "bargauge" }, {
"datasource": { "type": "loki", "uid": "Loki" }, "fieldConfig": { "defaults": { "color": { "mode":
"thresholds" }, "custom": { "align": "left", "hideFrom": { "legend": false, "tooltip": false, "viz":
false } }, "decimals": 0, "mappings": [], "thresholds": { "mode": "absolute", "steps": [ { "color":
"#a7f3d0", "value": null }, { "color": "#fde68a", "value": 1 }, { "color": "#fca5a5", "value": 10 }
] }, "unit": "none" }, "overrides": [ { "matcher": { "id": "byFrameRefID", "options": "A" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e04c4c" } }, { "id":
"displayName", "value": "ERROR" } ] }, { "matcher": { "id": "byFrameRefID", "options": "B" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e0714c" } }, { "id":
"displayName", "value": "WARN" } ] } ] }, "gridPos": { "h": 3, "w": 24, "x": 0, "y": 46 }, "id":
102, "options": { "displayMode": "gradient", "maxVizWidth": 200, "minVizHeight": 1, "minVizWidth":
0, "orientation": "horizontal", "reduceOptions": { "calcs": [ "lastNotNull" ], "values": false },
"showUnfilled": true, "text": { "titleSize": 10, "valueSize": 7 } }, "targets": [ { "datasource": {
"type": "loki", "uid": "Loki" }, "editorMode": "code", "expr":
"sum(count_over_time({service_name=\"work4fun\", level=\"ERROR\"}[1h]))", "hide": false,
"legendFormat": "", "refId": "A" }, { "datasource": { "type": "loki", "uid": "Loki" }, "editorMode":
"code", "expr": "sum(count_over_time({service_name=\"work4fun\", level=\"WARN\"}[1h]))", "hide":
false, "legendFormat": "", "refId": "B" } ], "title": "1 hour:", "type": "bargauge" }, {
"datasource": { "type": "loki", "uid": "Loki" }, "fieldConfig": { "defaults": { "color": { "mode":
"thresholds" }, "custom": { "align": "left", "hideFrom": { "legend": false, "tooltip": false, "viz":
false } }, "decimals": 0, "mappings": [], "thresholds": { "mode": "absolute", "steps": [ { "color":
"#a7f3d0", "value": null }, { "color": "#fde68a", "value": 1 }, { "color": "#fca5a5", "value": 10 }
] }, "unit": "none" }, "overrides": [ { "matcher": { "id": "byFrameRefID", "options": "A" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e04c4c" } }, { "id":
"displayName", "value": "ERROR" } ] }, { "matcher": { "id": "byFrameRefID", "options": "B" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e0714c" } }, { "id":
"displayName", "value": "WARN" } ] } ] }, "gridPos": { "h": 3, "w": 24, "x": 0, "y": 50 }, "id":
103, "options": { "displayMode": "gradient", "maxVizWidth": 200, "minVizHeight": 1, "minVizWidth":
0, "orientation": "horizontal", "reduceOptions": { "calcs": [ "lastNotNull" ], "values": false },
"showUnfilled": true, "text": { "titleSize": 10, "valueSize": 7 } }, "targets": [ { "datasource": {
"type": "loki", "uid": "Loki" }, "editorMode": "code", "expr":
"sum(count_over_time({service_name=\"work4fun\", level=\"ERROR\"}[6h]))", "hide": false,
"legendFormat": "", "refId": "A" }, { "datasource": { "type": "loki", "uid": "Loki" }, "editorMode":
"code", "expr": "sum(count_over_time({service_name=\"work4fun\", level=\"WARN\"}[6h]))", "hide":
false, "legendFormat": "", "refId": "B" } ], "title": "6 hours:", "type": "bargauge" }, {
"datasource": { "type": "loki", "uid": "Loki" }, "fieldConfig": { "defaults": { "color": { "mode":
"thresholds" }, "custom": { "align": "left", "hideFrom": { "legend": false, "tooltip": false, "viz":
false } }, "decimals": 0, "mappings": [], "thresholds": { "mode": "absolute", "steps": [ { "color":
"#a7f3d0", "value": null }, { "color": "#fde68a", "value": 1 }, { "color": "#fca5a5", "value": 10 }
] }, "unit": "none" }, "overrides": [ { "matcher": { "id": "byFrameRefID", "options": "A" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e04c4c" } }, { "id":
"displayName", "value": "ERROR" } ] }, { "matcher": { "id": "byFrameRefID", "options": "B" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e0714c" } }, { "id":
"displayName", "value": "WARN" } ] } ] }, "gridPos": { "h": 3, "w": 24, "x": 0, "y": 54 }, "id":
104, "options": { "displayMode": "gradient", "maxVizWidth": 200, "minVizHeight": 1, "minVizWidth":
0, "orientation": "horizontal", "reduceOptions": { "calcs": [ "lastNotNull" ], "values": false },
"showUnfilled": true, "text": { "titleSize": 10, "valueSize": 7 } }, "targets": [ { "datasource": {
"type": "loki", "uid": "Loki" }, "editorMode": "code", "expr":
"sum(count_over_time({service_name=\"work4fun\", level=\"ERROR\"}[24h]))", "hide": false,
"legendFormat": "", "refId": "A" }, { "datasource": { "type": "loki", "uid": "Loki" }, "editorMode":
"code", "expr": "sum(count_over_time({service_name=\"work4fun\", level=\"WARN\"}[24h]))", "hide":
false, "legendFormat": "", "refId": "B" } ], "title": "24 hours:", "type": "bargauge" }, {
"datasource": { "type": "loki", "uid": "Loki" }, "fieldConfig": { "defaults": { "color": { "mode":
"thresholds" }, "custom": { "align": "left", "hideFrom": { "legend": false, "tooltip": false, "viz":
false } }, "decimals": 0, "mappings": [], "thresholds": { "mode": "absolute", "steps": [ { "color":
"#a7f3d0", "value": null }, { "color": "#fde68a", "value": 1 }, { "color": "#fca5a5", "value": 10 }
] }, "unit": "none" }, "overrides": [ { "matcher": { "id": "byFrameRefID", "options": "A" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e04c4c" } }, { "id":
"displayName", "value": "ERROR" } ] }, { "matcher": { "id": "byFrameRefID", "options": "B" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e0714c" } }, { "id":
"displayName", "value": "WARN" } ] } ] }, "gridPos": { "h": 3, "w": 24, "x": 0, "y": 58 }, "id":
105, "options": { "displayMode": "gradient", "maxVizWidth": 200, "minVizHeight": 1, "minVizWidth":
0, "orientation": "horizontal", "reduceOptions": { "calcs": [ "lastNotNull" ], "values": false },
"showUnfilled": true, "text": { "titleSize": 10, "valueSize": 7 } }, "targets": [ { "datasource": {
"type": "loki", "uid": "Loki" }, "editorMode": "code", "expr":
"sum(count_over_time({service_name=\"work4fun\", level=\"ERROR\"}[7d]))", "hide": false,
"legendFormat": "", "refId": "A" }, { "datasource": { "type": "loki", "uid": "Loki" }, "editorMode":
"code", "expr": "sum(count_over_time({service_name=\"work4fun\", level=\"WARN\"}[7d]))", "hide":
false, "legendFormat": "", "refId": "B" } ], "title": "7 days:", "type": "bargauge" }, {
"datasource": { "type": "loki", "uid": "Loki" }, "fieldConfig": { "defaults": { "color": { "mode":
"thresholds" }, "custom": { "align": "left", "hideFrom": { "legend": false, "tooltip": false, "viz":
false } }, "decimals": 0, "mappings": [], "thresholds": { "mode": "absolute", "steps": [ { "color":
"#a7f3d0", "value": null }, { "color": "#fde68a", "value": 1 }, { "color": "#fca5a5", "value": 10 }
] }, "unit": "none" }, "overrides": [ { "matcher": { "id": "byFrameRefID", "options": "A" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e04c4c" } }, { "id":
"displayName", "value": "ERROR" } ] }, { "matcher": { "id": "byFrameRefID", "options": "B" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e0714c" } }, { "id":
"displayName", "value": "WARN" } ] } ] }, "gridPos": { "h": 3, "w": 24, "x": 0, "y": 62 }, "id":
106, "options": { "displayMode": "gradient", "maxVizWidth": 200, "minVizHeight": 1, "minVizWidth":
0, "orientation": "horizontal", "reduceOptions": { "calcs": [ "lastNotNull" ], "values": false },
"showUnfilled": true, "text": { "titleSize": 10, "valueSize": 7 } }, "targets": [ { "datasource": {
"type": "loki", "uid": "Loki" }, "editorMode": "code", "expr":
"sum(count_over_time({service_name=\"work4fun\", level=\"ERROR\"}[30d]))", "hide": false,
"legendFormat": "", "refId": "A" }, { "datasource": { "type": "loki", "uid": "Loki" }, "editorMode":
"code", "expr": "sum(count_over_time({service_name=\"work4fun\", level=\"WARN\"}[30d]))", "hide":
false, "legendFormat": "", "refId": "B" } ], "title": "30 days:", "type": "bargauge" }, {
"datasource": { "type": "loki", "uid": "Loki" }, "fieldConfig": { "defaults": { "color": { "mode":
"thresholds" }, "custom": { "align": "left", "hideFrom": { "legend": false, "tooltip": false, "viz":
false } }, "decimals": 0, "mappings": [], "thresholds": { "mode": "absolute", "steps": [ { "color":
"#a7f3d0", "value": null }, { "color": "#fde68a", "value": 1 }, { "color": "#fca5a5", "value": 10 }
] }, "unit": "none" }, "overrides": [ { "matcher": { "id": "byFrameRefID", "options": "A" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e04c4c" } }, { "id":
"displayName", "value": "ERROR" } ] }, { "matcher": { "id": "byFrameRefID", "options": "B" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e0714c" } }, { "id":
"displayName", "value": "WARN" } ] } ] }, "gridPos": { "h": 3, "w": 24, "x": 0, "y": 42 }, "id":
101, "options": { "displayMode": "gradient", "maxVizWidth": 200, "minVizHeight": 1, "minVizWidth":
0, "orientation": "horizontal", "reduceOptions": { "calcs": [ "lastNotNull" ], "values": false },
"showUnfilled": true, "text": { "titleSize": 10, "valueSize": 7 } }, "targets": [ { "datasource": {
"type": "loki", "uid": "Loki" }, "editorMode": "code", "expr":
"sum(count_over_time({service_name=\"work4fun\", level=\"ERROR\"}[5m]))", "hide": false,
"legendFormat": "", "refId": "A" }, { "datasource": { "type": "loki", "uid": "Loki" }, "editorMode":
"code", "expr": "sum(count_over_time({service_name=\"work4fun\", level=\"WARN\"}[5m]))", "hide":
false, "legendFormat": "", "refId": "B" } ], "title": "5 minutes:", "type": "bargauge" }, {
"datasource": { "type": "loki", "uid": "Loki" }, "fieldConfig": { "defaults": { "color": { "mode":
"thresholds" }, "custom": { "align": "left", "hideFrom": { "legend": false, "tooltip": false, "viz":
false } }, "decimals": 0, "mappings": [], "thresholds": { "mode": "absolute", "steps": [ { "color":
"#a7f3d0", "value": null }, { "color": "#fde68a", "value": 1 }, { "color": "#fca5a5", "value": 10 }
] }, "unit": "none" }, "overrides": [ { "matcher": { "id": "byFrameRefID", "options": "A" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e04c4c" } }, { "id":
"displayName", "value": "ERROR" } ] }, { "matcher": { "id": "byFrameRefID", "options": "B" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e0714c" } }, { "id":
"displayName", "value": "WARN" } ] } ] }, "gridPos": { "h": 3, "w": 24, "x": 0, "y": 46 }, "id":
102, "options": { "displayMode": "gradient", "maxVizWidth": 200, "minVizHeight": 1, "minVizWidth":
0, "orientation": "horizontal", "reduceOptions": { "calcs": [ "lastNotNull" ], "values": false },
"showUnfilled": true, "text": { "titleSize": 10, "valueSize": 7 } }, "targets": [ { "datasource": {
"type": "loki", "uid": "Loki" }, "editorMode": "code", "expr":
"sum(count_over_time({service_name=\"work4fun\", level=\"ERROR\"}[1h]))", "hide": false,
"legendFormat": "", "refId": "A" }, { "datasource": { "type": "loki", "uid": "Loki" }, "editorMode":
"code", "expr": "sum(count_over_time({service_name=\"work4fun\", level=\"WARN\"}[1h]))", "hide":
false, "legendFormat": "", "refId": "B" } ], "title": "1 hour:", "type": "bargauge" }, {
"datasource": { "type": "loki", "uid": "Loki" }, "fieldConfig": { "defaults": { "color": { "mode":
"thresholds" }, "custom": { "align": "left", "hideFrom": { "legend": false, "tooltip": false, "viz":
false } }, "decimals": 0, "mappings": [], "thresholds": { "mode": "absolute", "steps": [ { "color":
"#a7f3d0", "value": null }, { "color": "#fde68a", "value": 1 }, { "color": "#fca5a5", "value": 10 }
] }, "unit": "none" }, "overrides": [ { "matcher": { "id": "byFrameRefID", "options": "A" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e04c4c" } }, { "id":
"displayName", "value": "ERROR" } ] }, { "matcher": { "id": "byFrameRefID", "options": "B" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e0714c" } }, { "id":
"displayName", "value": "WARN" } ] } ] }, "gridPos": { "h": 3, "w": 24, "x": 0, "y": 50 }, "id":
103, "options": { "displayMode": "gradient", "maxVizWidth": 200, "minVizHeight": 1, "minVizWidth":
0, "orientation": "horizontal", "reduceOptions": { "calcs": [ "lastNotNull" ], "values": false },
"showUnfilled": true, "text": { "titleSize": 10, "valueSize": 7 } }, "targets": [ { "datasource": {
"type": "loki", "uid": "Loki" }, "editorMode": "code", "expr":
"sum(count_over_time({service_name=\"work4fun\", level=\"ERROR\"}[6h]))", "hide": false,
"legendFormat": "", "refId": "A" }, { "datasource": { "type": "loki", "uid": "Loki" }, "editorMode":
"code", "expr": "sum(count_over_time({service_name=\"work4fun\", level=\"WARN\"}[6h]))", "hide":
false, "legendFormat": "", "refId": "B" } ], "title": "6 hours:", "type": "bargauge" }, {
"datasource": { "type": "loki", "uid": "Loki" }, "fieldConfig": { "defaults": { "color": { "mode":
"thresholds" }, "custom": { "align": "left", "hideFrom": { "legend": false, "tooltip": false, "viz":
false } }, "decimals": 0, "mappings": [], "thresholds": { "mode": "absolute", "steps": [ { "color":
"#a7f3d0", "value": null }, { "color": "#fde68a", "value": 1 }, { "color": "#fca5a5", "value": 10 }
] }, "unit": "none" }, "overrides": [ { "matcher": { "id": "byFrameRefID", "options": "A" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e04c4c" } }, { "id":
"displayName", "value": "ERROR" } ] }, { "matcher": { "id": "byFrameRefID", "options": "B" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e0714c" } }, { "id":
"displayName", "value": "WARN" } ] } ] }, "gridPos": { "h": 3, "w": 24, "x": 0, "y": 54 }, "id":
104, "options": { "displayMode": "gradient", "maxVizWidth": 200, "minVizHeight": 1, "minVizWidth":
0, "orientation": "horizontal", "reduceOptions": { "calcs": [ "lastNotNull" ], "values": false },
"showUnfilled": true, "text": { "titleSize": 10, "valueSize": 7 } }, "targets": [ { "datasource": {
"type": "loki", "uid": "Loki" }, "editorMode": "code", "expr":
"sum(count_over_time({service_name=\"work4fun\", level=\"ERROR\"}[24h]))", "hide": false,
"legendFormat": "", "refId": "A" }, { "datasource": { "type": "loki", "uid": "Loki" }, "editorMode":
"code", "expr": "sum(count_over_time({service_name=\"work4fun\", level=\"WARN\"}[24h]))", "hide":
false, "legendFormat": "", "refId": "B" } ], "title": "24 hours:", "type": "bargauge" }, {
"datasource": { "type": "loki", "uid": "Loki" }, "fieldConfig": { "defaults": { "color": { "mode":
"thresholds" }, "custom": { "align": "left", "hideFrom": { "legend": false, "tooltip": false, "viz":
false } }, "decimals": 0, "mappings": [], "thresholds": { "mode": "absolute", "steps": [ { "color":
"#a7f3d0", "value": null }, { "color": "#fde68a", "value": 1 }, { "color": "#fca5a5", "value": 10 }
] }, "unit": "none" }, "overrides": [ { "matcher": { "id": "byFrameRefID", "options": "A" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e04c4c" } }, { "id":
"displayName", "value": "ERROR" } ] }, { "matcher": { "id": "byFrameRefID", "options": "B" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e0714c" } }, { "id":
"displayName", "value": "WARN" } ] } ] }, "gridPos": { "h": 3, "w": 24, "x": 0, "y": 58 }, "id":
105, "options": { "displayMode": "gradient", "maxVizWidth": 200, "minVizHeight": 1, "minVizWidth":
0, "orientation": "horizontal", "reduceOptions": { "calcs": [ "lastNotNull" ], "values": false },
"showUnfilled": true, "text": { "titleSize": 10, "valueSize": 7 } }, "targets": [ { "datasource": {
"type": "loki", "uid": "Loki" }, "editorMode": "code", "expr":
"sum(count_over_time({service_name=\"work4fun\", level=\"ERROR\"}[7d]))", "hide": false,
"legendFormat": "", "refId": "A" }, { "datasource": { "type": "loki", "uid": "Loki" }, "editorMode":
"code", "expr": "sum(count_over_time({service_name=\"work4fun\", level=\"WARN\"}[7d]))", "hide":
false, "legendFormat": "", "refId": "B" } ], "title": "7 days:", "type": "bargauge" }, {
"datasource": { "type": "loki", "uid": "Loki" }, "fieldConfig": { "defaults": { "color": { "mode":
"thresholds" }, "custom": { "align": "left", "hideFrom": { "legend": false, "tooltip": false, "viz":
false } }, "decimals": 0, "mappings": [], "thresholds": { "mode": "absolute", "steps": [ { "color":
"#a7f3d0", "value": null }, { "color": "#fde68a", "value": 1 }, { "color": "#fca5a5", "value": 10 }
] }, "unit": "none" }, "overrides": [ { "matcher": { "id": "byFrameRefID", "options": "A" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e04c4c" } }, { "id":
"displayName", "value": "ERROR" } ] }, { "matcher": { "id": "byFrameRefID", "options": "B" },
"properties": [ { "id": "color", "value": { "mode": "fixed", "fixedColor": "#e0714c" } }, { "id":
"displayName", "value": "WARN" } ] } ] }, "gridPos": { "h": 3, "w": 24, "x": 0, "y": 62 }, "id":
106, "options": { "displayMode": "gradient", "maxVizWidth": 200, "minVizHeight": 1, "minVizWidth":
0, "orientation": "horizontal", "reduceOptions": { "calcs": [ "lastNotNull" ], "values": false },
"showUnfilled": true, "text": { "titleSize": 10, "valueSize": 7 } }, "targets": [ { "datasource": {
"type": "loki", "uid": "Loki" }, "editorMode": "code", "expr":
"sum(count_over_time({service_name=\"work4fun\", level=\"ERROR\"}[30d]))", "hide": false,
"legendFormat": "", "refId": "A" }, { "datasource": { "type": "loki", "uid": "Loki" }, "editorMode":
"code", "expr": "sum(count_over_time({service_name=\"work4fun\", level=\"WARN\"}[30d]))", "hide":
false, "legendFormat": "", "refId": "B" } ], "title": "30 days:", "type": "bargauge" } ]
