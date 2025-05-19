let turnaroundResult = [];

import { updateTableColumns } from "../script.js";

export function renderGanttChart(result, options = {}, ganttChart) {
  console.log("Type of ganttChart:", typeof ganttChart);
  console.log("Value of ganttChart:", ganttChart);

  const {
    showQueue = true,
    algorithm = "FCFS",
    containerIds = {
      head: "head",
      body: "gbody",
      tail: "tail",
      queue: "queue",
    },
  } = options;

  console.table("oo nga" + ganttChart);

  const h = document.getElementById(containerIds.head);
  const b = document.getElementById(containerIds.body);
  const t = document.getElementById(containerIds.tail);
  const q = document.getElementById(containerIds.queue);

  h.innerHTML = "";
  b.innerHTML = "";
  t.innerHTML = "";
  if (showQueue && q) q.innerHTML = "";

  const timeline = [];
  const timelineProcess = [];
  const burstDurations = [];
  const timeMarkers = [];

  renderQueueTimeline(ganttChart, q, algorithm);

  ganttChart.forEach((entry) => {
    timeline.push(entry.start);
    timelineProcess.push(entry.label);
    burstDurations.push(entry.end - entry.start);
    timeMarkers.push(entry.start);
  });

  if (ganttChart.length > 0) {
    timeMarkers.push(ganttChart[ganttChart.length - 1].end);
  }

  // Tail (Time scale)
  const allTimePoints = ganttChart.map((e) => e.start);
  allTimePoints.push(ganttChart[ganttChart.length - 1].end);
  allTimePoints.forEach((time, i) => {
    const timeDiv = document.createElement("div");
    timeDiv.classList.add("text-start");
    timeDiv.style.width = "40px";
    timeDiv.style.minWidth = "40px";
    timeDiv.innerHTML = `${time}`;
    if (i === allTimePoints.length - 1) {
      timeDiv.classList.add("bg-blue", "text-center", "rounded", "px-2");
      timeDiv.style.height = "fit-content";
      timeDiv.style.width = "fit-content";
    }
    t.appendChild(timeDiv);
  });

  // Body (Gantt process blocks)
  timelineProcess.forEach((label) => {
    const box = document.createElement("div");
    box.classList.add("border", "p-2", "text-center");
    box.style.width = "40px";
    box.style.minWidth = "40px";
    box.innerHTML = `${label}`;
    b.appendChild(box);
  });

  if (algorithm === "RR" || algorithm === "SRTF" || algorithm === "PP") {
    const headPanel = document.createElement("div");
    headPanel.classList.add("d-flex", "flex-column");

    // Headers
    const rbtHeader = document.createElement("div");
    rbtHeader.classList.add("d-flex", "flex-row");
    const btHeader = document.createElement("div");
    btHeader.classList.add("d-flex", "flex-row");

    // Header Labels
    const rbtLbl = document.createElement("div");
    rbtLbl.style.width = "40px";
    rbtLbl.style.minWidth = "40px";
    rbtLbl.innerHTML = "<strong>RBt</strong>";
    rbtHeader.appendChild(rbtLbl);

    const btLbl = document.createElement("div");
    btLbl.style.width = "40px";
    btLbl.style.minWidth = "40px";
    btLbl.innerHTML = "<strong>Bt</strong>";
    btHeader.appendChild(btLbl);

    const originalBurstMap = {};
    result.forEach((proc) => {
      originalBurstMap[proc.process ?? proc.label] = proc.burst;
    });
    const rbtMap = {};
    const appearedProcesses = new Set();

    // Add RBt and Bt per Gantt chart entry

    ganttChart.forEach((entry) => {
      const rbtDiv = document.createElement("div");
      rbtDiv.style.width = "40px";
      rbtDiv.style.minWidth = "40px";

      const btDiv = document.createElement("div");
      btDiv.style.width = "40px";
      btDiv.style.minWidth = "40px";

      if (entry.label === "i") {
        rbtDiv.textContent = "";
        btDiv.textContent = "1"; // Idle time
      } else {
        rbtDiv.textContent = entry.rbt === 0 ? "" : entry.rbt ?? "";

        if (appearedProcesses.has(entry.label)) {
          // Process already appeared before - show remaining burst time from rbtMap
          btDiv.textContent = rbtMap[entry.label];
          // Update rbtMap with latest rbt for next appearance
          rbtMap[entry.label] = entry.rbt;
        } else {
          // First appearance - show original burst time
          btDiv.textContent = originalBurstMap[entry.label] ?? "";
          appearedProcesses.add(entry.label);
          // Initialize rbtMap for the process with its current rbt
          rbtMap[entry.label] = entry.rbt;
        }
      }

      rbtHeader.appendChild(rbtDiv);
      btHeader.appendChild(btDiv);
    });

    headPanel.appendChild(rbtHeader);
    headPanel.appendChild(btHeader);
    h.appendChild(headPanel);
  } else {
    // Head (Burst Times)
    const burstLabel = document.createElement("div");
    burstLabel.style.width = "40px";
    burstLabel.innerHTML = "Bt";
    h.appendChild(burstLabel);

    burstDurations.forEach((dur) => {
      const btDiv = document.createElement("div");
      btDiv.style.width = "40px";
      btDiv.style.minWidth = "40px";

      btDiv.innerHTML = `${dur}`;
      h.appendChild(btDiv);
    });
  }
}
function renderQueueTimeline(ganttChart, q, algorithm) {
  if (!q) return;
  q.innerHTML = ""; // Reset container

  const allLabels = new Set();
  ganttChart.forEach((entry) => {
    entry.queue?.forEach((p) =>
      allLabels.add(typeof p === "object" ? p.process : p)
    );
    entry.arrived?.forEach((p) =>
      allLabels.add(typeof p === "object" ? p.process : p)
    );
  });

  // 🟢 Track processes that are already completed
  const completedSet = new Set();

  ganttChart.forEach((entry) => {
    const queueDiv = document.createElement("div");
    queueDiv.classList.add("text-center");
    queueDiv.style.width = "40px";
    queueDiv.style.minWidth = "40px";
    queueDiv.style.display = "flex";
    queueDiv.style.flexDirection = "column";
    queueDiv.style.alignItems = "center";

    const renderProc = (proc) => {
      const span = document.createElement("span");
      const name = typeof proc === "object" ? proc.process : proc;
      const priority = typeof proc === "object" ? proc.priority : null;

      span.textContent = priority ? `${name}(${priority})` : name;
      console.log(
        "Checking slash for",
        name,
        "vs",
        entry.label,
        "RBT:",
        entry.rbt
      );

      // ✅ Slash only once — when it finishes
      if (
        ["RR", "SRTF", "PP"].includes(algorithm) &&
        entry.label === name &&
        (entry.rbt === 0 ||
          algorithm === "SRTF" ||
          algorithm === "RR" ||
          algorithm === "PP") &&
        !completedSet.has(name)
      ) {
        span.classList.add("slashed");
        completedSet.add(name); // Mark as completed
        console.log("Slashing", name, "at time", entry.end);
      } else if (
        ["FCFS", "SJF", "NPP"].includes(algorithm) &&
        entry.label === name
      ) {
        span.classList.add("slashed");
        completedSet.add(name); // Mark as completed
        console.log("Slashing", name, "at time", entry.end);
      }

      queueDiv.appendChild(span);
    };

    entry.queue?.forEach(renderProc);
    entry.arrived?.forEach(renderProc);

    q.appendChild(queueDiv);
  });
}

export function renderResultTableTurnaround(result) {
  const tbody = document.querySelector("#resultTable tbody");
  tbody.innerHTML = "";

  // Sort result by process name (P1, P2...)
  result.sort((a, b) => {
    const aNum = parseInt(a.process.replace(/\D/g, ""));
    const bNum = parseInt(b.process.replace(/\D/g, ""));
    return aNum - bNum;
  });
  let process = 1; // Reset process counter for display
  let ave;
  result.forEach((r) => {
    const row = `
      <tr>
        <td>Tt${process++}</td>
        <td class="d-flex flex-row">${r.completion} <pre>  -  </pre> ${
      r.arrival
    } <pre>  =  </pre> ${r.turnaround}</td>
      </tr>
    `;
    ave = (ave || 0) + r.turnaround;
    tbody.insertAdjacentHTML("beforeend", row);
    turnaroundResult.push(r.turnaround); // Store for later use
  });
  const ttave = `<tr>
  <td>TTave</td>
  <td class="d-flex flex-row">${ave} <pre>  /  </pre> ${
    process - 1
  } <pre>  =  </pre> <div class="bg-blue px-2 rounded" style="height: fit-content">${(
    ave /
    (process - 1)
  ).toFixed(2)} ms</div></td>
  </tr>`;
  tbody.insertAdjacentHTML("beforeend", ttave);
}

export function renderResultTableWaiting(result) {
  const tbody = document.querySelector("#resultTableWaitingTime tbody");
  tbody.innerHTML = "";

  // Sort result by process name (P1, P2...)
  result.sort((a, b) => {
    const aNum = parseInt(a.process.replace(/\D/g, ""));
    const bNum = parseInt(b.process.replace(/\D/g, ""));
    return aNum - bNum;
  });
  let process = 1; // Reset process counter for display
  let ave;
  result.forEach((r) => {
    const row = `
      <tr>
        <td>Wt${process}</td>
        <td class="d-flex flex-row">${
          turnaroundResult[process - 1]
        } <pre>  -  </pre> ${r.burst} <pre>  =  </pre> ${r.waiting}</td>
      </tr>
    `;
    process++;
    ave = (ave || 0) + r.waiting;
    tbody.insertAdjacentHTML("beforeend", row);
  });
  const ttave = `<tr>
  <td>WTave</td>
  <td class="d-flex flex-row">${ave} <pre>  /  </pre> ${
    process - 1
  } <pre>  =  </pre> <div class="bg-blue px-2 rounded" style="height: fit-content">${(
    ave /
    (process - 1)
  ).toFixed(2)} ms</div> </td>
  </tr>`;
  tbody.insertAdjacentHTML("beforeend", ttave);
}

export function generateTimeline(result) {
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";

  const vrline = document.createElement("div");
  vrline.className = "timeline-vrline";

  // Group processes by arrival time
  const grouped = {};
  result.forEach((p) => {
    if (!grouped[p.arrival]) {
      grouped[p.arrival] = [];
    }
    grouped[p.arrival].push(p.process);
  });

  // Sort by arrival time
  const sortedArrivals = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  // Render grouped blocks
  sortedArrivals.forEach((arrival) => {
    const block = document.createElement("div");
    block.className =
      "timeline-block d-flex flex-column gap-2 px-2 py-1 text-center";
    block.style.maxWidth = "60px";
    block.style.width = "60px";

    block.innerHTML = `
        <div class="fw-semibold">${grouped[arrival].join(", ")}</div>
        <div class="timeline-hrline"><div class="line"></div></div>
        <div class="text">${arrival}</div>
      `;

    timeline.appendChild(block);
  });

  timeline.appendChild(vrline);
}

export function renderCPUUtilization(result, totalIdle, ganttChart) {
  let timeline = [];
  let totalBurst = 0;

  ganttChart.forEach((p) => {
    const duration = p.end - p.start;
    timeline.push(duration);
    totalBurst += duration;
  });

  let totalBt = 0;

  result.forEach((p) => {
    totalBt += p.burst;
  });
  const totalTime =
    ganttChart.length > 0 ? ganttChart[ganttChart.length - 1].end : 0;
  const cpuUtil = ((totalTime - totalIdle) / totalTime) * 100;
  document.getElementById("burstt").textContent = ` ${totalBurst}`;
  document.getElementById("adds").textContent = ` ${totalBt} `;
  document.getElementById("wala").textContent = ` × 100 =`;
  document.getElementById("waladin").textContent = `  =`;
  document.getElementById("cpuTotal").textContent = `${cpuUtil.toFixed(2)}%`;

  // Display all timeline times
  const timelineElement = document.getElementById("completion");
  timelineElement.textContent = `${timeline.join(" + ")}`;

  // Display the number of processes
  const processCountElement = document.getElementById("process");
  processCountElement.textContent = `${totalBt}`;
}

export function renderTableHeader(tableSelector, algorithm) {
  const thead = document.querySelector(`${tableSelector} thead`);
  if (!thead) return;

  let headerHTML = `
      <tr>
       <th>
                  <div class="title-yellow flex-fill text-center">
                    Jobs/Processes
                  </div>
                </th>
                <th>
                  <div class="title-yellow flex-fill text-center">
                    Arival Time
                  </div>
                </th>
                <th>
                  <div class="title-yellow flex-fill text-center">
                    Burst Time
                  </div>
                </th>
    `;
  //   if (algorithm == "RR") {
  //     headerHTML += `<th>
  //           <div class="title-yellow flex-fill text-center">
  //            Time Quantum
  //           </div>
  //         </th>`;
  //   }
  if (algorithm === "PP" || algorithm === "NPP") {
    headerHTML += `<th>
                  <div class="title-yellow flex-fill text-center">
                   Priority
                  </div>
                </th>`;
  }

  headerHTML += `</tr>`;
  thead.innerHTML = headerHTML;
}
let processCounter = 2;

export function addRow(tableSelector, algorithm = "", isFirstRow = false) {
  const tableBody = document.querySelector(`${tableSelector} tbody`);
  const row = document.createElement("tr");

  let rowContent = `
    <th>
      <div class="input-yellow flex-fill jobs text-center d-flex justify-content-center align-items-center" style="height: 100%">
        P${processCounter++}
      </div>
    </th>
    <td>
      <input type="number" min="0" aria-label="Arrival Time input" class="input-yellow flex-fill form-control shadow-none" />
    </td>
    <td>
      <input type="number" min="0" aria-label="Burst Time input" class="input-yellow flex-fill form-control shadow-none" style="min-width: 0" />
    </td>
  `;

  // Add Time Quantum column only if it's the first row and algorithm is RR
  if (algorithm === "RR" && isFirstRow) {
    rowContent += `
      <td class="timeQuantum-col">
        <input type="number" min="1" class="input-yellow flex-fill form-control shadow-none" id="timeQuantum" />
      </td>
    `;
  }

  // Add Priority column if algorithm is NPP or PP
  if (algorithm === "NPP" || algorithm === "PP") {
    rowContent += `
      <td class="priority-col">
        <input type="number" min="0" class="input-yellow flex-fill form-control shadow-none"  />
      </td>
    `;
  }

  row.innerHTML = rowContent;

  tableBody.appendChild(row);
}

export function onAlgorithmChange(algorithm) {
  processCounter = 1;

  const tableBody = document.querySelector("#processTable tbody");
  tableBody.innerHTML = ""; // Clear previous rows

  // Add the first row (with or without Time Quantum depending on algorithm)
  addRow("#processTable", algorithm, true); // Pass `true` for first row

  // Add subsequent rows (only Arrival Time, Burst Time, Priority if needed)
  for (let i = 1; i < 1; i++) {
    // Change 5 to your desired number of rows
    addRow("#processTable", algorithm);
  }
  updateTableColumns(algorithm); // Also updates headers
}

export function deleteRow(tableSelector) {
  const tableBody = document.querySelector(`${tableSelector} tbody`);
  const rows = tableBody.querySelectorAll("tr");
  if (rows.length > 1) {
    tableBody.removeChild(rows[rows.length - 1]);
    processCounter--;
  }
}

export function getProcessData(tableSelector, mode = "priority") {
  const rows = document.querySelectorAll(`${tableSelector} tbody tr`);
  const processes = [];

  let timeQuantum = null;
  if (mode === "roundrobin") {
    const tqInput = document.getElementById("timeQuantum");
    if (tqInput) {
      const parsedTQ = parseInt(tqInput.value);
      if (!isNaN(parsedTQ) && parsedTQ > 0) {
        timeQuantum = parsedTQ;
      } else {
        console.warn("Invalid or missing time quantum input.");
      }
    }
  }

  rows.forEach((row) => {
    const name = row.querySelector(".jobs")?.textContent.trim();
    const inputs = row.querySelectorAll("input");

    const arrival = parseInt(inputs[0]?.value);
    const burst = parseInt(inputs[1]?.value);
    const extra = parseInt(inputs[2]?.value);

    if (!isNaN(arrival) && !isNaN(burst)) {
      const process = {
        process: name,
        arrival,
        burst,
      };

      if (mode === "priority" && !isNaN(extra)) {
        process.priority = extra;
      }

      processes.push(process);
    }
  });

  return { processes, timeQuantum }; // Always return both
}
