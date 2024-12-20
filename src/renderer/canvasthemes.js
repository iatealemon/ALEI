export const canvasThemes = {
    0: { // THEME_BLUE
        // Grid colors.
        backgroundColor: "#5880AB",
        gridColor: "#FFFFFF",
        // Object select colors.
        selectOutlineColor: "#A5A500",
        selectEdgeOpacityFactor: 1,
        selectTextColor: "#FF0",
        // Selection area colors.
        selectionColor: "#FFF",
        selectionCtrlColor: "#AFA",
        selectionAltColor: "#FAA",
        selectionOpacity: 0.1, // Note that this and below is NOT opacity FACTOR
        selectionEdgeOpacity: 0.8,
        // Highlighted object edge color. (When included in selection area)
        highLightedObjEdgeColor: window.selgrd3, // NOTE: #FFFF00 seems nice. Bright but it is clearly noticeable.
        highLightedObjEdgeOpacity: 1,
        // Object connection line.
        objectConnectionDash: [4, 4],
        objectConnectionOutgoingColor: "#66ff66", // old name objectConnectionToColor
        objectConnectionIncomingColor: "#ffffff", // old name objectConnectionFromColor
        objectConnectionOpacityFactor: 1, // TODO: Should this just be "opacity" and not "opacity factor"?
        objectColors: {
            box: {col: "#FFF", edgeCol: "#FFF"},
            door: {col: "#000", edgeCol: "#000", invisibleOpacityFactor: 0.05},
            water: {
                col: "#3592B9", edgeCol: "#91EAFF", opacityFactor: 0.24,
                acidCol: "#BBFB59", acidEdgeCol: "#91EAFF", acidOpacityFactor: 0.81
            },
            pushf: {col: "#2BFF40", edgeCol: "#3CFF4F"},
            region: {col: "#FFD52B", edgeCol: "#FFB03C", edgeOpacityFactor: 0.5, buttonOpacityFactor: 0.5},
            bg: {col: "#000", edgeCol: "#910000", edgeOpacityFactor: 0.3, coloredOpacityFactor: 0.22}
        },
    },
    1: { // THEME_DARK
        backgroundColor: "#222222",
        gridColor: "#888888",
        selectOutlineColor: "#FFFF00",
        selectEdgeOpacityFactor: 1,
        selectTextColor: "#FF0",
        selectionColor: "#FFF",
        selectionCtrlColor: "#AFA",
        selectionAltColor: "#FAA",
        selectionOpacity: 0.1,
        selectionEdgeOpacity: 0.8,
        highLightedObjEdgeColor: window.selgrd3,
        highLightedObjEdgeOpacity: 1,
        objectConnectionDash: [4, 4],
        objectConnectionOutgoingColor: "#66ff66",
        objectConnectionIncomingColor: "#ffffff",
        objectConnectionOpacityFactor: 1,
        objectColors: {
            box: {col: "#FFF", edgeCol: "#FFF"},
            door: {col: "#000", edgeCol: "#000", invisibleOpacityFactor: 0.05},
            water: {
                col: "#3592B9", edgeCol: "#91EAFF", opacityFactor: 0.24,
                acidCol: "#BBFB59", acidEdgeCol: "#91EAFF", acidOpacityFactor: 0.81
            },
            pushf: {col: "#2BFF40", edgeCol: "#3CFF4F"},
            region: {col: "#FFD52B", edgeCol: "#FFB03C", edgeOpacityFactor: 0.5, buttonOpacityFactor: 0.5},
            bg: {col: "#000", edgeCol: "#910000", edgeOpacityFactor: 0.3, coloredOpacityFactor: 0.22}
        },
    },
    2: { // THEME_GREEN
        backgroundColor: "#222222",
        gridColor: "#FFFFFF",
        selectOutlineColor: "#FFFF00",
        selectEdgeOpacityFactor: 1,
        selectTextColor: "#FF0",
        selectionColor: "#FFF",
        selectionCtrlColor: "#AFA",
        selectionAltColor: "#FAA",
        selectionOpacity: 0.1,
        selectionEdgeOpacity: 0.8,
        highLightedObjEdgeColor: window.selgrd3,
        highLightedObjEdgeOpacity: 1,
        objectConnectionDash: [4, 4],
        objectConnectionOutgoingColor: "#66ff66",
        objectConnectionIncomingColor: "#ffffff",
        objectConnectionOpacityFactor: 1,
        objectColors: {
            box: {col: "#FFF", edgeCol: "#FFF"},
            door: {col: "#000", edgeCol: "#000", invisibleOpacityFactor: 0.05},
            water: {
                col: "#3592B9", edgeCol: "#91EAFF", opacityFactor: 0.24,
                acidCol: "#BBFB59", acidEdgeCol: "#91EAFF", acidOpacityFactor: 0.81
            },
            pushf: {col: "#2BFF40", edgeCol: "#3CFF4F"},
            region: {col: "#FFD52B", edgeCol: "#FFB03C", edgeOpacityFactor: 0.5, buttonOpacityFactor: 0.5},
            bg: {col: "#000", edgeCol: "#910000", edgeOpacityFactor: 0.3, coloredOpacityFactor: 0.22}
        },
    },
    3: { // THEME_PURPLE
        backgroundColor: "#222222",
        gridColor: "#FFFFFF",
        selectOutlineColor: "#FFFF00",
        selectEdgeOpacityFactor: 1,
        selectTextColor: "#FF0",
        selectionColor: "#FFF",
        selectionCtrlColor: "#AFA",
        selectionAltColor: "#FAA",
        selectionOpacity: 0.1,
        selectionEdgeOpacity: 0.8,
        highLightedObjEdgeColor: window.selgrd3,
        highLightedObjEdgeOpacity: 1,
        objectConnectionDash: [4, 4],
        objectConnectionOutgoingColor: "#66ff66",
        objectConnectionIncomingColor: "#ffffff",
        objectConnectionOpacityFactor: 1,
        objectColors: {
            box: {col: "#FFF", edgeCol: "#FFF"},
            door: {col: "#000", edgeCol: "#000", invisibleOpacityFactor: 0.05},
            water: {
                col: "#3592B9", edgeCol: "#91EAFF", opacityFactor: 0.24,
                acidCol: "#BBFB59", acidEdgeCol: "#91EAFF", acidOpacityFactor: 0.81
            },
            pushf: {col: "#2BFF40", edgeCol: "#3CFF4F"},
            region: {col: "#FFD52B", edgeCol: "#FFB03C", edgeOpacityFactor: 0.5, buttonOpacityFactor: 0.5},
            bg: {col: "#000", edgeCol: "#910000", edgeOpacityFactor: 0.3, coloredOpacityFactor: 0.22}
        },
    },
    4: { // ALEI Black Theme
        backgroundColor: "#222222",
        gridColor: "#FFFFFF50",
        selectOutlineColor: "#FFFF00",
        selectEdgeOpacityFactor: 1,
        selectTextColor: "#FF0",
        selectionColor: "#FFF",
        selectionCtrlColor: "#AFA",
        selectionAltColor: "#FAA",
        selectionOpacity: 0.1,
        selectionEdgeOpacity: 0.8,
        highLightedObjEdgeColor: window.selgrd3,
        highLightedObjEdgeOpacity: 1,
        objectConnectionDash: [4, 4],
        objectConnectionOutgoingColor: "#66ff66",
        objectConnectionIncomingColor: "#ffffff",
        objectConnectionOpacityFactor: 1,
        objectColors: {
            box: {col: "#FFF", edgeCol: "#FFF"},
            door: {col: "#000", edgeCol: "#000", invisibleOpacityFactor: 0.05},
            water: {
                col: "#3592B9", edgeCol: "#91EAFF", opacityFactor: 0.24,
                acidCol: "#BBFB59", acidEdgeCol: "#91EAFF", acidOpacityFactor: 0.81
            },
            pushf: {col: "#2BFF40", edgeCol: "#3CFF4F"},
            region: {col: "#FFD52B", edgeCol: "#FFB03C", edgeOpacityFactor: 0.5, buttonOpacityFactor: 0.5},
            bg: {col: "#000", edgeCol: "#910000", edgeOpacityFactor: 0.3, coloredOpacityFactor: 0.22}
        },
    }
};