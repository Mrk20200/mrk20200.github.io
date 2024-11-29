const scaffolding = new Scaffolding.Scaffolding();
const searchParams = new URL(location.href).searchParams;
const startOverlay = document.getElementById("startOverlay");
const loadOverlay = document.getElementById("loadOverlay");
const progress = document.getElementById("loadProgress");
const progressText = document.getElementById("loadProgressText");
const greenFlagControl = document.getElementById("green-flag-button");
const stopAllControl = document.getElementById("stop-all-button");

async function getProjectData(projectLocation) {
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
			progressText.innerText = `Downloading project (${Math.floor(Math.min(recievedLength / contentLength, 1) * 100)}%) ...`;
		}

		let data = new Blob(chunks, {type: "application/x.scratch.sb3"});
		return await data.arrayBuffer();
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
	if (project) {
		scaffolding.vm.on("ASSET_PROGRESS", update_progress);
		scaffolding.vm.runtime.on("PROJECT_LOADED", finished_loading);
		scaffolding.loadProject(project);
	}
};

function init() {
	scaffolding.width = 480;
	scaffolding.height = 360;
	scaffolding.resizeMode = 'preserve-ratio';
	scaffolding.editableLists = false;
	scaffolding.shouldConnectPeripherals = true;
	scaffolding.usePackagedRuntime = false;
	scaffolding.setup();

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

	loadProject(`https://raw.githubusercontent.com/Mrk20200/scratch-archive/main/${searchParams.get("file")}`);
}

function startProject() {
	startOverlay.hidden = true;
	scaffolding.greenFlag();
}

function stopProject() {
	scaffolding.stopAll();
}

addEventListener("DOMContentLoaded", () => {
	try {
		init();
	} catch (error) {
		loadOverlay.innerText = `Failed to load project: ${error.message}`;
	}
});