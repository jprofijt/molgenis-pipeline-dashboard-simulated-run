const fetch = require('node-fetch');
const base64 = require('base-64');

async function postData(url = '', data = {}, method = 'POST') {
  // Default options are marked with *
  let headers = new fetch.Headers()
  headers.set('Authorization', 'Basic ' + base64.encode("admin" + ":" + "admin"));
  headers.set('Content-Type', 'application/json')

  const response = await fetch(url, {
    method: method, // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: headers,
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *client
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  return await response.json(); // parses JSON response into native JavaScript objects
}

function checkDoubleDigit(digit) {
  let digitString = digit.toString()
  if (digitString.length === 1) {
    return `0${digitString}`
  } else {
    return digitString
  }
}

function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function makeNumericId(length) {
  var result           = '';
  var characters       = '0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
const date = new Date();
const year = date.getFullYear().toString().slice(-2);
const month = checkDoubleDigit(date.getMonth() + 1);
const day = checkDoubleDigit(date.getDate());
const dateString = `${year}${month}${day}`
const identifier = makeid(10)
const suffix = "QXTR_12"
const runID = `${dateString}_${identifier}_${suffix}`
const projectPrefix = `QXTR_${makeNumericId(3)}_`
const ONCO = `${projectPrefix}ONCO_v5`
const Exoom = `${projectPrefix}Exoom_v3`
const PCS = `${projectPrefix}PCS_v5`
const SVP = `${projectPrefix}SVP_v5`
const projectsArray = [ONCO, Exoom, PCS, SVP]

function createJobs(project, statusArray = ["Waiting", "Waiting", "Waiting"], finishDate = false) {
  let job1Date = new Date()
  job1Date.setHours(job1Date.getHours() - 1)
  return [
    {
      "project_job": `${project}_s01_create`,
      "job": "s01_create",
      "project": project,
      "url": "http://localhost:8081/",
      "status": statusArray[0],
      "started_date": job1Date.toISOString(),
      "finished_date": finishDate ? date.toISOString() : "",
      "step": "create"
    },
    {
      "project_job": `${project}_s02_analyse`,
      "job": "s02_analyse",
      "project": project,
      "url": "http://localhost:8081/",
      "status": statusArray[1],
      "started_date": job1Date.toISOString(),
      "finished_date": finishDate ? date.toISOString() : "",
      "step": "analyse"
    },
    {
      "project_job": `${project}_s03_finishoff`,
      "job": "s03_finishoff",
      "project": project,
      "url": "http://localhost:8081/",
      "status": statusArray[2],
      "started_date": job1Date.toISOString(),
      "finished_date": finishDate ? date.toISOString() : "",
      "step": "finishoff"
    }
  ]
}
let jobs = {
  entities: []
}

projectsArray.forEach((project) => {
  jobs.entities = [...jobs.entities, ...createJobs(project)]
})

const projects = {
  entities: [
    {
    "project": ONCO,
    "url": "http://localhost:8081/",
    "run_id": runID,
    "pipeline": "DNA",
    "comment": "",
    "copy_results_prm": "Waiting"
    },
    {
      "project": Exoom,
      "url": "http://localhost:8081/",
      "run_id": runID,
      "pipeline": "DNA",
      "comment": "",
      "copy_results_prm": "Waiting"
    },
    {
      "project": PCS,
      "url": "http://localhost:8081/",
      "run_id": runID,
      "pipeline": "DNA",
      "comment": "",
      "copy_results_prm": "Waiting"
    },
    {
      "project": SVP,
      "url": "http://localhost:8081/",
      "run_id": runID,
      "pipeline": "DNA",
      "comment": "",
      "copy_results_prm": "Waiting"
    }
  ]
}
const run = {
  entities: [
    {
      "run_id": runID,
      "group": "demo",
      "demultiplexing": "Waiting",
      "copy_raw_prm": "Waiting",
      "date": `${date.getFullYear().toString()}-${month}-${day}`
    }
  ]
}




async function startDemultiplexing() {
  run.entities[0]["demultiplexing"] = "Started"
  return postData(`http://localhost:8081/api/v2/status_overview`, run, 'PUT').then((response) => {
    return Promise.resolve()
  }).catch((error) => {
    console.error(error)
  })
}
async function finishDemultiplexing() {
  run.entities[0]["demultiplexing"] = "Finished"
  run.entities[0]["copy_raw_prm"] = "Started"
  return postData(`http://localhost:8081/api/v2/status_overview`, run, 'PUT').then((response) => {
    return Promise.resolve()
  }).catch((error) => {
    console.error(error)
  })
}

async function startPipelines() {
  run.entities[0]["copy_raw_prm"] = "finished"
  jobs.entities = []
  projectsArray.forEach((project) => {
    jobs.entities = [...jobs.entities, ...createJobs(project, ["Started", "Waiting", "Waiting"])]
  })
  return postData(`http://localhost:8081/api/v2/status_overview`, run, 'PUT').then((response) => {
    postData("http://localhost:8081/api/v2/status_jobs", jobs, 'PUT').then(() => {
      return Promise.resolve()
    }).catch((error) => {
      console.error(error)
      return Promise.reject()
    })
  }).catch((error) => {
    console.error(error)
    return Promise.reject()
  })
}

async function progressPipelines1() {
  jobs.entities = []
  projectsArray.forEach((project) => {
    jobs.entities = [...jobs.entities, ...createJobs(project, ["Finished", "Started", "Waiting"])]
  })
  return postData("http://localhost:8081/api/v2/status_jobs", jobs, 'PUT').then(() => {
    return Promise.resolve()
  }).catch((error) => {
    console.error(error)
    return Promise.reject()
  })
}
async function introduceError() {
  jobs.entities = []
  projectsArray.forEach((project) => {
    jobs.entities = [...jobs.entities, ...createJobs(project, ["finished", "Error", "Waiting"])]
  })
  return postData("http://localhost:8081/api/v2/status_jobs", jobs, 'PUT').then(() => {
      return Promise.resolve()
  }).catch((error) => {
    console.error(error)
    return Promise.reject()
  })
}
async function progressPipelines2() {
  jobs.entities = []
  projectsArray.forEach((project) => {
    jobs.entities = [...jobs.entities, ...createJobs(project, ["finished", "finished", "Started"])]
  })
  return postData("http://localhost:8081/api/v2/status_jobs", jobs, 'PUT').then(() => {
      return Promise.resolve()
  }).catch((error) => {
    console.error(error)
    return Promise.reject()
  })
}

async function finishPipelines() {
  run.entities[0]["copy_raw_prm"] = "finished"
  jobs.entities = []
  projectsArray.forEach((project) => {
    jobs.entities = [...jobs.entities, ...createJobs(project, ["finished", "finished", "finished"], true)]
  })
  return postData("http://localhost:8081/api/v2/status_jobs", jobs, 'PUT').then(() => {
      return Promise.resolve()
    }).catch((error) => {
      console.error(error)
      return Promise.reject()
    })
}

async function startCopyingResults() {
  const projectsResultsStart = {
    entities: [
      {
      "project": ONCO,
      "url": "http://localhost:8081/",
      "run_id": runID,
      "pipeline": "DNA",
      "comment": "",
      "copy_results_prm": "Started"
      },
      {
        "project": Exoom,
        "url": "http://localhost:8081/",
        "run_id": runID,
        "pipeline": "DNA",
        "comment": "",
        "copy_results_prm": "Started"
      },
      {
        "project": PCS,
        "url": "http://localhost:8081/",
        "run_id": runID,
        "pipeline": "DNA",
        "comment": "",
        "copy_results_prm": "Started"
      },
      {
        "project": SVP,
        "url": "http://localhost:8081/",
        "run_id": runID,
        "pipeline": "DNA",
        "comment": "",
        "copy_results_prm": "Started"
      }
    ]
  }
  return postData(`http://localhost:8081/api/v2/status_projects`, projectsResultsStart, 'PUT')
  
}

async function finishRun() {
  const projectsFinished = {
    entities: [
      {
      "project": ONCO,
      "url": "http://localhost:8081/",
      "run_id": runID,
      "pipeline": "DNA",
      "comment": "",
      "copy_results_prm": "finished"
      },
      {
        "project": Exoom,
        "url": "http://localhost:8081/",
        "run_id": runID,
        "pipeline": "DNA",
        "comment": "",
        "copy_results_prm": "finished"
      },
      {
        "project": PCS,
        "url": "http://localhost:8081/",
        "run_id": runID,
        "pipeline": "DNA",
        "comment": "",
        "copy_results_prm": "finished"
      },
      {
        "project": SVP,
        "url": "http://localhost:8081/",
        "run_id": runID,
        "pipeline": "DNA",
        "comment": "",
        "copy_results_prm": "finished"
      }
    ]
  }
  return postData("http://localhost:8081/api/v2/status_projects", projectsFinished, 'PUT').then(() => {
    return Promise.resolve()
  }).catch((error) => {
    console.error(error)
    return Promise.reject()
  }).finally(() => {
    process.exit(0)
  })
}




// When user input data and click enter key.
function startRun(data) {
  if (data === 'error') {
    console.log("Simulating run with error")
    postData("http://localhost:8081/api/v2/status_jobs", jobs).then((response) => {
      postData("http://localhost:8081/api/v2/status_projects", projects).then((response2) => {
        postData("http://localhost:8081/api/v2/status_overview", run).then((response3) => {
          setTimeout(startDemultiplexing, 10000)
          setTimeout(finishDemultiplexing, 20000)
          setTimeout(startPipelines, 30000)
          setTimeout(progressPipelines1, 40000)
          setTimeout(introduceError, 50000)
          setTimeout(progressPipelines2, 70000)
          setTimeout(finishPipelines, 80000)
          setTimeout(startCopyingResults, 90000)
          setTimeout(finishRun, 100000)
        })})})
    
  } else {
    console.log("Simulating run without error")
    postData("http://localhost:8081/api/v2/status_jobs", jobs).then((response) => {
      postData("http://localhost:8081/api/v2/status_projects", projects).then((response2) => {
        postData("http://localhost:8081/api/v2/status_overview", run).then((response3) => {
          setTimeout(startDemultiplexing, 10000)
          setTimeout(finishDemultiplexing, 20000)
          setTimeout(startPipelines, 30000)
          setTimeout(progressPipelines1, 40000)
          setTimeout(progressPipelines2, 50000)
          setTimeout(finishPipelines, 60000)
          setTimeout(startCopyingResults, 70000)
          setTimeout(finishRun, 80000)
        })})})
  }
}
const keyword = process.argv[2]
if (keyword === "delay") {
  setTimeout(function() {
    startRun(keyword)
  }, 12000)
} else {
  startRun(keyword)
}



