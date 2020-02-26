#! /bin/bash

startRun()
{
  node index.js
}

startErrorRun()
{
  node index.js error
}

startDelayedRun()
{
  node index.js delay
}

startRun & startErrorRun & startDelayedRun