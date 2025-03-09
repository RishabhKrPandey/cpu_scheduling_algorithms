// jobs 
// create add process functionality
// computation of each algorithm



let processcount = 0;
let Gantt = [];
function addProcess(){
    processcount++;
    let table = document.getElementById('processTable');
    let row = table.insertRow();
    row.innerHTML = `<td>${processcount}</td>
                             <td><input type="number" value="0" class="table-input"></td>
                             <td><input type="number" value="5" class="table-input"></td>
                             <td><input type="number" value="1" class="table-input"></td>`;
}

function removeProcess()
{
    let table = document.getElementById('processTable');
    if(table.rows.length >= 1){
        table.deleteRow(-1);
        processcount--;
    }
}
// code to display data of ct ,tat,wt
function displayResults(process) {
    let table = document.getElementById("processTable");
    table.innerHTML = `<tr><th>PID</th><th>AT</th><th>BT</th><th>Priority</th><th>CT</th><th>TAT</th><th>WT</th></tr>`;
    process.forEach(p => table.innerHTML += `<tr><td>${p.pid}</td><td>${p.at}</td><td>${p.bt}</td><td>${p.priority}</td><td>${p.ct}</td><td>${p.tat}</td><td>${p.wt}</td></tr>`);
}



function calculateScheduling(){
    // tapping into the data and processing it for use
    let table=document.getElementById('processTable');
    let rows = table.getElementsByTagName('tr');
    let algorithm = document.getElementById('algorithm').value;
    let process = [];
    for(let i = 1; i<rows.length; i++){
        let cols = rows[i].getElementsByTagName('input');
        let pid = i;
        let at = parseInt(cols[0].value);
        let bt = parseInt(cols[1].value);
        let priority = parseInt(cols[2].value) || 0; // 0 in case if no priority
        // push all in process
        process.push({pid,at,bt,priority, ct:0, tat:0, wt:0});


    }
    // now we need to call the required algorithm 
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

// now we need to write logic of each scheduling algorithm
function fcfsScheduling(process){
    process.sort((a,b) => a.at-b.at); // custom sort to sort in order of arrival time
    let currentTime = 0; // to identify process at the momemt
    let ganttdata = [];
    process.forEach(p =>{
        if(currentTime < p.at) currentTime = p.at;
        let startTime = currentTime;
        p.ct = currentTime+p.bt;
        p.tat = p.ct-p.at;
        p.wt = p.tat-p.bt;
        currentTime = p.ct;
        ganttdata.push({pid:p.pid, start:startTime, end:p.ct}); // to drwa gantt chart


    });
    displayResults(process);
    drawGanttChart(ganttdata);
    

}

// now sjf algorithm
function sjfScheduling(process){
    process.sort((a,b) => a.at-b.at);
    let currentTime = 0, completed = 0; 
    let ganttdata = [];
    let readyQueue = process.filter(p => p.at <= currentTime && p.ct ===0);
    readyQueue.sort((a,b) => a.bt-b.bt);

    // compute required data
    // while there is process in ready queue
    if(readyQueue.length > 0){
        let p = readyQueue[0];
        let startTime = currentTime;
        p.ct = currentTime+p.bt;
        p.tat = p.ct-p.at;
        p.wt = p.tat-p.bt;
        currentTime = p.ct;
        ganttdata.push({ pid: process.pid, start: startTime, end: process.ct });
    }
    else{
        currentTime++;
    }
    displayResults(process);
    drawGanttChart(ganttdata);
    
}

// preemptive sjf
function psjfScheduling(processes) {
    let n = processes.length;
    let currentTime = 0;
    let completed = 0;
    let ganttData = [];
    
    // Initialize remaining burst times
    processes.forEach(p => p.remainingBt = p.bt);

    while (completed < n) {
        // Get ready processes and sort by Remaining Burst Time
        let readyQueue = processes.filter(p => p.at <= currentTime && p.remainingBt > 0);
        readyQueue.sort((a, b) => a.remainingBt - b.remainingBt);

        if (readyQueue.length > 0) {
            let process = readyQueue[0]; // Pick the process with the shortest remaining time
            let startTime = currentTime;

            process.remainingBt -= 1; // Execute for 1 unit of time
            currentTime++;

            if (process.remainingBt === 0) {
                process.ct = currentTime;
                process.tat = process.ct - process.at;
                process.wt = process.tat - process.bt;
                completed++;
            }

            // Store Gantt Chart Data
            ganttData.push({ pid: process.pid, start: startTime, end: currentTime });
        } else {
            currentTime++; // If no process is available, increase time
        }
    }

    displayResults(processes);
    drawGanttChart(ganttData);
    
    
}

// non preemptive priority schheduling
// similar code approach as sjf but sort wrt to priority
function priorityScheduling(processes) {
    processes.sort((a, b) => a.at - b.at); // Sort by Arrival Time
    let currentTime = 0, completed = 0;
    let ganttData = [];

    while (completed < processes.length) {
        // Get ready processes (arrived but not completed)
        let readyQueue = processes.filter(p => p.at <= currentTime && p.ct === 0);
        
        // Sort by Priority (Lower value = Higher Priority)
        readyQueue.sort((a, b) => a.priority - b.priority);

        if (readyQueue.length > 0) {
            let p = readyQueue[0]; // Pick the process with the highest priority
            let startTime = currentTime;

            // Compute Completion, Turnaround, and Waiting Time
            p.ct = currentTime + p.bt;
            p.tat = p.ct - p.at;
            p.wt = p.tat - p.bt;
            currentTime = p.ct;
            completed++;

            // Store Gantt Chart Data
            ganttData.push({ pid: p.pid, start: startTime, end: p.ct });
        } else {
            currentTime++; // If no process is available, increase time
        }
    }

    displayResults(processes);
    drawGanttChart(ganttData);
    
    
}


// preemptive priority scheduling
// quite same as that in psjf
function ppriorityScheduling(processes) {
    let n = processes.length;
    let currentTime = 0;
    let completed = 0;
    let ganttData = [];

    // Initialize remaining burst times
    processes.forEach(p => {
        p.remainingBt = p.bt; // Track remaining execution time
        p.ct = 0;  // Completion Time
    });

    while (completed < n) {
        // Get ready processes and sort by Priority (Lower value = Higher Priority)
        let readyQueue = processes.filter(p => p.at <= currentTime && p.remainingBt > 0);
        readyQueue.sort((a, b) => a.priority - b.priority);

        if (readyQueue.length > 0) {
            let p = readyQueue[0]; // Pick the process with the highest priority
            let startTime = currentTime;

            p.remainingBt -= 1; // Execute for 1 unit of time
            currentTime++;

            if (p.remainingBt === 0) {
                p.ct = currentTime;
                p.tat = p.ct - p.at;
                p.wt = p.tat - p.bt;
                completed++;
            }

            // Store execution history in Gantt Chart
            ganttData.push({ pid: p.pid, start: startTime, end: currentTime });
        } else {
            currentTime++; // If no process is available, increase time
        }
    }

    displayResults(processes);
    drawGanttChart(ganttData);
    
    
}
function roundRobinScheduling(processes, quantum) {
    let queue = [...processes];
    // filled the queuw with processes
    let currentTime = 0, ganttData = [];

    while (queue.length > 0) {
        // while  there is process in queue
        let p = queue.shift();
        let startTime = currentTime;
        let executionTime = Math.min(quantum, p.bt);
        // if quantum > bt process complete executed
        p.bt -= executionTime;
        currentTime += executionTime;

        if (p.bt > 0) queue.push(p);
        // if still bt push back in qeuue
        else {
            // otherwise compute the results

            p.ct = currentTime;
            p.tat = p.ct - p.at;
            p.wt = p.tat - executionTime;
        }

        ganttData.push({ pid: p.pid, start: startTime, end: currentTime });
    }

    displayResults(processes);
    drawGanttChart(ganttData);
    
    
}

function drawGanttChart(ganttData) {
    let canvas = document.getElementById("ganttChartCanvas");
    let ctx = canvas.getContext("2d");

    // Set the canvas size dynamically
    canvas.width = 600; // Increased width for better spacing
    canvas.height = 200; // More height to fit all processes

    // Extract unique process IDs and assign colors
    let processIds = [...new Set(ganttData.map(p => p.pid))]; // Get unique process IDs
    let processColors = {}; // Store color for each process

    processIds.forEach(pid => {
        processColors[pid] = getRandomBestColor(); // Assign a random color
    });

    // Extract data for Chart.js
    let labels = ["Execution Timeline"]; // Single row for all processes
    let processData = ganttData.map(p => ({
        label: `P${p.pid}`,
        data: [{ x: p.start, y: "Execution Timeline", x2: p.end }],
        backgroundColor: processColors[p.pid] // Use the assigned color
    }));

    // Destroy previous chart instance if it exists (to prevent duplication)
    if (window.ganttChartInstance) {
        window.ganttChartInstance.destroy();
    }

    // Create the new Gantt Chart using Chart.js
    window.ganttChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: processData.map(p => ({
                label: p.label,
                data: p.data.map(d => d.x2 - d.x), // Duration
                backgroundColor: p.backgroundColor,
                borderColor: "black",
                borderWidth: 1,
                barThickness: 30
            }))
        },
        options: {
            indexAxis: "y", // Horizontal orientation
            responsive: true,
            
            scales: {
                x: {
                    type: "linear",
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Time Units"
                    },
                    ticks: { stepSize: 1 }
                },
                y: {
                    title: {
                        display: true,
                        text: "Processes (Executed in Order)"
                    }
                }
            },
            plugins: {
                legend: { display: true } // Show legend for process colors
            }
        }
    });
}

// Helper function to generate random colors for Chart.js
const bestColors = [
    "#FF5733", // Bright Red-Orange
    "#33FF57", // Neon Green
    "#3357FF", // Vivid Blue
    "#FF33A8", // Pink Magenta
    "#FFD700", // Golden Yellow
    "#FF8C00", // Dark Orange
    "#8A2BE2", // Blue Violet
    "#00CED1", // Dark Turquoise
    "#FF4500", // Orange Red
    "#228B22"  // Forest Green
];

// Function to get a random color from the bestColors array
function getRandomBestColor() {
    return bestColors[Math.floor(Math.random() * bestColors.length)];
}
function calculateAverages(processes) {
    let totalWT = 0, totalTAT = 0;

    processes.forEach(p => {
        totalWT += p.wt;
        totalTAT += p.tat;
    });

    let avgWT = (totalWT / processes.length).toFixed(2);
    let avgTAT = (totalTAT / processes.length).toFixed(2);

    return { avgWT, avgTAT };
}
function displayAverages(avgWT, avgTAT) {
    document.getElementById("avgResults").innerHTML = `
        
        <p><strong>Average Waiting Time (AWT):</strong> ${avgWT} units</p>
        <p><strong>Average Turnaround Time (ATAT):</strong> ${avgTAT} units</p>
    `;
}









