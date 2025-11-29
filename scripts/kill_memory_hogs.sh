#!/bin/bash

# Check if a process is using more than the specified percentage of memory
# Usage: ./kill_memory_hogs.sh [threshold_percentage] [exclude_pid1,exclude_pid2,...]

THRESHOLD=${1:-50}  # Default threshold is 50%
EXCLUDE_PIDS=${2:-""}

IFS=',' read -ra EXCLUDE_ARRAY <<< "$EXCLUDE_PIDS"

echo "Checking for processes using more than ${THRESHOLD}% memory..."
echo "Excluded PIDs: $EXCLUDE_PIDS"

# Get processes sorted by memory usage
PROCS=$(ps -eo pid,ppid,user,comm,%mem --sort=-%mem | head -20)
echo "$PROCS"

# Process each line to find memory hogs
echo "$PROCS" | while read -r line; do
    if [[ $line =~ ^[[:space:]]*([0-9]+)[[:space:]]+([0-9]+)[[:space:]]+([^[:space:]]+)[[:space:]]+([^[:space:]]+)[[:space:]]+([0-9]+\.[0-9]+) ]]; then
        PID="${BASH_REMATCH[1]}"
        PPID="${BASH_REMATCH[2]}"
        USER="${BASH_REMATCH[3]}"
        COMMAND="${BASH_REMATCH[4]}"
        MEM="${BASH_REMATCH[5]}"
        
        # Skip header line and excluded PIDs
        if [[ "$PID" == "PID" ]]; then
            continue
        fi
        
        SKIP=0
        for EXCLUDE_PID in "${EXCLUDE_ARRAY[@]}"; do
            if [[ "$PID" == "$EXCLUDE_PID" ]]; then
                SKIP=1
                break
            fi
        done
        
        if [[ $SKIP -eq 1 ]]; then
            continue
        fi
        
        # Check if memory usage exceeds threshold
        if (( $(echo "$MEM > $THRESHOLD" | bc -l) )); then
            echo "Found memory hog: PID $PID ($COMMAND) using $MEM% memory"
            read -p "Kill this process? (y/n): " confirm
            if [[ $confirm == [yY] ]]; then
                echo "Killing PID $PID..."
                kill -9 "$PID"
                echo "Process killed."
            else
                echo "Skipping PID $PID."
            fi
        fi
    fi
done

echo "Done checking memory usage."
