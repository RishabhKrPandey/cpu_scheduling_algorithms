let processcount = 0;

function addProcess() {
    processcount++;
    let table = document.getElementById('processTable');
    let row = table.insertRow();
    row.innerHTML = `<td>${processcount}</td>
                     <td><input type="number" value="0" class="table-input"></td>
                     <td><input type="number" value="5" class="table-input"></td>
                     <td><input type="number" value="1" class="table-input"></td>`;
}

function removeProcess() {
    let table = document.getElementById('processTable');
    if (table.rows.length > 1) {
        table.deleteRow(-1);
        processcount--;
    }
}

function calculateScheduling() {
    let table = document.getElementById('processTable');
    let rows = table.getElementsByTagName('tr');
    let algorithm = document.getElementById('algorithm').value;
    let process = [];

    for (let i = 1; i < rows.length; i++) {
        let cols = rows[i].getElementsByTagName('input');
        let pid = i;
        let at = parseInt(cols[0].value);
        let bt = parseInt(cols[1].value);
        let priority = parseInt(cols[2].value) || 0;
        process.push({ pid, at, bt, priority, ct: 0, tat: 0, wt: 0, remainingBt: bt });
    }

    if (algorithm === "FCFS") fcfsScheduling(process);
    else if (algorithm === "SJF") sjfScheduling(process);
    else if (algorithm === "PSJF") psjfScheduling(process);
    else if (algorithm === "Priority") priorityScheduling(process);
    else if (algorithm === "PPriority") ppriorityScheduling(process);
    else if (algorithm === "RoundRobin") {
        let quantum = parseInt(prompt("Enter Time Quantum:", 2));
        roundRobinScheduling(process, quantum);
    }

    let { avgWT, avgTAT } = calculateAverages(process);
    displayAverages(avgWT, avgTAT);
}

function fcfsScheduling(processes) {
    processes.sort((a, b) => a.at - b.at);
    let currentTime = 0, ganttData = [];

    processes.forEach(p => {
        if (currentTime < p.at) currentTime = p.at;
        let startTime = currentTime;
        p.ct = currentTime + p.bt;
        p.tat = p.ct - p.at;
        p.wt = p.tat - p.bt;
        currentTime = p.ct;
        ganttData.push({ pid: p.pid, start: startTime, end: p.ct });
    });

    displayResults(processes);
    drawGanttChart(ganttData);
}

function sjfScheduling(processes) {
    processes.sort((a, b) => a.at - b.at);
    let currentTime = 0, completed = 0, ganttData = [];

    while (completed < processes.length) {
        let readyQueue = processes.filter(p => p.at <= currentTime && p.ct === 0);
        readyQueue.sort((a, b) => a.bt - b.bt);

        if (readyQueue.length > 0) {
            let p = readyQueue[0];
            let startTime = currentTime;
            p.ct = currentTime + p.bt;
            p.tat = p.ct - p.at;
            p.wt = p.tat - p.bt;
            currentTime = p.ct;
            completed++;
            ganttData.push({ pid: p.pid, start: startTime, end: p.ct });
        } else {
            currentTime++;
        }
    }

    displayResults(processes);
    drawGanttChart(ganttData);
}

function psjfScheduling(processes) {
    let currentTime = 0, completed = 0, ganttData = [];

    while (completed < processes.length) {
        let readyQueue = processes.filter(p => p.at <= currentTime && p.remainingBt > 0);
        readyQueue.sort((a, b) => a.remainingBt - b.remainingBt);

        if (readyQueue.length > 0) {
            let p = readyQueue[0];
            let startTime = currentTime;
            p.remainingBt--;
            currentTime++;

            if (p.remainingBt === 0) {
                p.ct = currentTime;
                p.tat = p.ct - p.at;
                p.wt = p.tat - p.bt;
                completed++;
            }

            ganttData.push({ pid: p.pid, start: startTime, end: currentTime });
        } else {
            currentTime++;
        }
    }

    displayResults(processes);
    drawGanttChart(ganttData);
}

function priorityScheduling(processes) {
    processes.sort((a, b) => a.at - b.at);
    let currentTime = 0, completed = 0, ganttData = [];

    while (completed < processes.length) {
        let readyQueue = processes.filter(p => p.at <= currentTime && p.ct === 0);
        readyQueue.sort((a, b) => a.priority - b.priority);

        if (readyQueue.length > 0) {
            let p = readyQueue[0];
            let startTime = currentTime;
            p.ct = currentTime + p.bt;
            p.tat = p.ct - p.at;
            p.wt = p.tat - p.bt;
            currentTime = p.ct;
            completed++;
            ganttData.push({ pid: p.pid, start: startTime, end: p.ct });
        } else {
            currentTime++;
        }
    }

    displayResults(processes);
    drawGanttChart(ganttData);
}

function roundRobinScheduling(processes, quantum) {
    let queue = [...processes];
    let currentTime = 0, ganttData = [];

    while (queue.length > 0) {
        let p = queue.shift();
        let startTime = currentTime;
        let executionTime = Math.min(quantum, p.remainingBt);
        p.remainingBt -= executionTime;
        currentTime += executionTime;

        if (p.remainingBt > 0) queue.push(p);
        else {
            p.ct = currentTime;
            p.tat = p.ct - p.at;
            p.wt = p.tat - p.bt;
        }

        ganttData.push({ pid: p.pid, start: startTime, end: currentTime });
    }

    displayResults(processes);
    drawGanttChart(ganttData);
}

function displayResults(processes) {
    let table = document.getElementById("processTable");
    table.innerHTML = `<tr><th>PID</th><th>AT</th><th>BT</th><th>Priority</th><th>CT</th><th>TAT</th><th>WT</th></tr>`;
    processes.forEach(p => table.innerHTML += `<tr><td>${p.pid}</td><td>${p.at}</td><td>${p.bt}</td><td>${p.priority}</td><td>${p.ct}</td><td>${p.tat}</td><td>${p.wt}</td></tr>`);
}

function drawGanttChart(ganttData) {
    let canvas = document.getElementById("ganttChartCanvas");
    let ctx = canvas.getContext("2d");

    canvas.width = 600;
    canvas.height = 100;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let unitWidth = canvas.width / ganttData[ganttData.length - 1].end;

    ganttData.forEach((p, index) => {
        ctx.fillStyle = "blue";
        ctx.fillRect(p.start * unitWidth, 20, (p.end - p.start) * unitWidth, 60);
        ctx.strokeRect(p.start * unitWidth, 20, (p.end - p.start) * unitWidth, 60);
        ctx.fillStyle = "white";
        ctx.fillText(`P${p.pid}`, (p.start + p.end) / 2 * unitWidth - 5, 50);
    });
    
}

function calculateAverages(processes) {
    let totalWT = 0, totalTAT = 0;
    processes.forEach(p => { totalWT += p.wt; totalTAT += p.tat; });
    return { avgWT: (totalWT / processes.length).toFixed(2), avgTAT: (totalTAT / processes.length).toFixed(2) };
}

function displayAverages(avgWT, avgTAT) {
    document.getElementById("avgResults").innerHTML = `<p><strong>AWT:</strong> ${avgWT} units | <strong>ATAT:</strong> ${avgTAT} units</p>`;
}
