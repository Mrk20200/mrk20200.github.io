addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("sb-project").forEach((element) => {
        let file = element.getAttribute("file");
        let parts = element.getAttribute("parts");
        let filename = file.substring(file.lastIndexOf("/") + 1, file.length) + ".sb3";
        if (parts) {
            element.innerHTML += ` (<a href="player.html?file=${file}.json">Play</a> | <a href="#${file}" onclick="downloadParts(${parts}, 'https://raw.githubusercontent.com/Mrk20200/scratch-archive/main/${file}', '${filename}');">Download*</a>)`;
        } else {
            element.innerHTML += ` (<a href="player.html?file=${file}.sb3">Play</a> | <a href="https://raw.githubusercontent.com/Mrk20200/scratch-archive/main/${file}.sb3">Download</a>)`;
        }
    });
});

async function downloadParts(parts, file, fileName) {
    document.getElementById("loadOverlay").hidden = false;
    let progress = document.getElementById("loadProgress");
    let progressText = document.getElementById("loadProgressText");
    progress.max = parts;

    let dataChunks = [];
    for (let i = 1; i <= parts; i++) {
        progress.value = i - 1;
        progressText.innerText = `Downloading project (${i - 1}/${parts}) ...`;
        let response = await fetch(`${file}_part${i}.sb3`);
        if (!response.ok) {
            document.getElementById("loadProgress").hidden = true;
            alert(`Got HTTP error ${response.status} while fetching part ${i}/${parts}!`);
            throw new Error(`Got HTTP error ${response.status} while fetching part ${i}/${parts}!`);
        }
        dataChunks.push(await response.arrayBuffer());
    }
    let project = new Blob(dataChunks, { type: "application/x.scratch.sb3" });
    let anchor = document.createElement("a");
    let projectURI = URL.createObjectURL(project);
    anchor.href = projectURI;
    anchor.download = fileName;
    anchor.click();
    document.getElementById("loadOverlay").hidden = true;
    setTimeout(URL.revokeObjectURL.bind(projectURI), 5000);
}