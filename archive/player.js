const scaffolding = new Scaffolding.Scaffolding();
const searchParams = new URL(location.href).searchParams;
const startOverlay = document.getElementById("startOverlay");
const loadOverlay = document.getElementById("loadOverlay");
const progress = document.createElement("progress");
const progressText = document.getElementById("loadProgressText");
progress.value = 0;
progress.max = 1;

const greenFlagControl = document.getElementById("green-flag-button");
const stopAllControl = document.getElementById("stop-all-button");

async function getProjectData(projectLocation) {
	document.getElementById("loadProgress").append(progress);
	try {
		const response = await fetch(projectLocation);
		if (!response.ok) {
			throw new Error(`Failed to load project: Got HTTP error ${response.status} while fetching project data`);
		}
		const dataReader = response.body.getReader();
		const contentLength = +response.headers.get('Content-Length');
		progress.max = contentLength * 2;

		let recievedLength = 0;
		let chunks = [];
		while (true) {
			const { done, value } = await dataReader.read();

			if (done) {
				break;
			}

			chunks.push(value);
			recievedLength += value.length;
			progress.value = recievedLength;
			progressText.innerText = `Downloading project (${Math.floor((recievedLength / contentLength) * 100)}%) ...`;
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
	progressText.innerText = `Loading assets (${current}/${max}) ...`;
}

async function loadProject(projectLocation) {
	const project = await getProjectData(projectLocation);
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

	greenFlagControl.addEventListener("click", () => {
		scaffolding.greenFlag();
	});
	stopAllControl.addEventListener("click", () => {
		scaffolding.stopAll();
	});
	scaffolding.addEventListener("PROJECT_RUN_START", () => {
		greenFlagControl.classList.add("active");
	});
	scaffolding.addEventListener("PROJECT_RUN_STOP", () => {
		greenFlagControl.classList.remove("active");
	});

	const storage = scaffolding.storage;
	storage.addWebStore(
		[storage.AssetType.ImageVector, storage.AssetType.ImageBitmap, storage.AssetType.Sound],
		(asset) => `https://assets.scratch.mit.edu/internalapi/asset/${asset.assetId}.${asset.dataFormat}/get/`
	);

	scaffolding.appendTo(document.getElementById('project'));

	loadProject(searchParams.get("file"));
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