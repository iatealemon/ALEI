const classToTitle = {
    box: "wall",
    door: "movable object",
    region: "region",
    pushf: "pushing area",
    bg: "background",
    water: "water area",
    player: "player",
    enemy: "enemy",
    vehicle: "vehicle",
    decor: "decoration",
    gun: "gun",
    lamp: "lamp",
    barrel: "barrel",
    trigger: "trigger",
    timer: "timer",
    inf: "engine mark",
    song: "song",
    image: "Image info"
};

/**
 * @param {E[]} selection 
 * @returns {string}
 */
export function makeGUISelInfoInnerHTML(selection) {
    if (selection.length === 0)
        return "Nothing selected";
    else {
        let selectionCountPerClass = {};
        for (const entity of selection) {
            if (!(entity._class in selectionCountPerClass)) selectionCountPerClass[entity._class] = 0;
            selectionCountPerClass[entity._class]++;
        }
        const selectedClasses = Object.keys(selectionCountPerClass);

        // text that says something like "1 wall, 3 backgrounds, 1 player, 3 decorations, 1 engine mark"
        let selectionDetailString = selectedClasses.map((_class) => {
            const selectedCountOfClass = selectionCountPerClass[_class];
            return `${selectedCountOfClass} ${tonumerous(classToTitle[_class], selectedCountOfClass)}`;
        }).join(", ");

        if (selectedClasses.length === 1) {
            const uidsListStr = 
                selection
                .filter(entity => entity.pm.uid !== undefined)
                .map(entity => `"${entity.pm.uid}"`)
                .join(", ");
            if (uidsListStr.length > 0) {
                // text that says something like "2 triggers: "#trigger*1", "#trigger*2""
                // the first part is added above
                selectionDetailString += ": " + uidsListStr;
            }
        }

        const plural = selection.length > 1;
        const text = `${selection.length} object${plural ? "s" : ""} selected (${selectionDetailString})`;
        return `${text} <a href="#" onclick="ForceDeselect()"><img src="noap.png" width="11" height="11" border="0"></a>`;
    }
}