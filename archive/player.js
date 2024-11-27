const scaffolding = new Scaffolding.Scaffolding();
const startOverlay = document.getElementById("startOverlay");
const loadOverlay = document.getElementById("loadOverlay");
const progress = document.createElement("progress");
progress.value = 0;
progress.max = 1;

async function getProjectData(projectLocation) {
    document.getElementById("loadProgress").append(progress);
    try {
        const response = await fetch(projectLocation);
        if (!response.ok) {
            throw new Error(`Failed to load project: Got HTTP error ${response.status} while fetching project data`);
        }
        const dataReader = response.body.getReader();
        const contentLength = +response.headers.get('Content-Length');
        progress.max = contentLength * 1.125;

        let recievedLength = 0;
        let chunks = [];
        while (true) {
            const { done, value } = await dataReader.read();

            if (done) {
                break;
            }

            chunks.push(value);
            recievedLength += value.length;
            progress.value += value.length;
        }

        let data = new Uint8Array(recievedLength);
        let position = 0;

        for (let chunk of chunks) {
            data.set(chunk, position);
            position += chunk.length;
        }
        return data;
    } catch (error) {
        loadOverlay.innerText = `Failed to load project: ${error.message}`;
    }
}

function finished_loading() {
    loadOverlay.hidden = true;
    startOverlay.hidden = false;
}

function update_progress(current, max) {
    progress.value = max + current;
    progress.max = max * 2;
}

async function loadProject(projectId) {
    const project = await getProjectData(projectId);
    scaffolding.vm.on("ASSET_PROGRESS", update_progress);
    scaffolding.vm.runtime.on("PROJECT_LOADED", finished_loading);
    scaffolding.loadProject(project);
};

function init() {
    scaffolding.width = 480;
    scaffolding.height = 360;
    scaffolding.resizeMode = 'preserve-ratio';
    scaffolding.editableLists = false;
    scaffolding.shouldConnectPeripherals = true;
    scaffolding.usePackagedRuntime = false;
    scaffolding.setup();
    scaffolding.appendTo(document.getElementById('project'));

    loadProject("dtp2.sb3");
}

function startProject() {
    startOverlay.hidden = true;
    scaffolding.greenFlag();
}

addEventListener("DOMContentLoaded", () => {
    try {
        init();
    } catch (error) {
        loadOverlay.innerText = `Failed to load project: ${error.message}`;
    }
});