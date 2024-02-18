function getCurrentDate() {
  const d = new Date();
  const month = '' + (d.getMonth() + 1);
  const day = '' + d.getDate();
  const year = d.getFullYear();
  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
};

Vue.directive('focus', {
  inserted: function (el) {
    el.focus()
  }
});

Vue.component('process-list', {
  template: `
  <div>
    <div class="side-menu">

      <div class="control-item">
        <div class="summary-section" v-if="summaryProjects.length || processWithoutProjectNameDuration">
          <div class="summary-column" v-for="(project, index) in summaryProjects" :key="index">
            <p>{{ project.name }}: <span class="summary-duration">{{ formatDuration(project.totalDuration) }}</span></p>
          </div>
          <div class="summary-column">
            <p v-if="processWithoutProjectNameDuration">Other: <span class="summary-duration-unassigned">{{ formatDuration(processWithoutProjectNameDuration) }}</span></p>
            <p>Total: <span class="summary-duration-total">{{ totalDuration }}</span></p>
            <p>Earnings: <span class="summary-earnings">{{ totalEarnings }} EUR</span></p>
          </div>
        </div>
      </div>

    </div>    

    <div class="table-container">

      <div class="controls-container">

        <div class="control-item">
          <button :class="{ 'process-control-button-running': isRunning, 'process-control-button-stopped': !isRunning, 'process-control-button': true }" @click="toggleStartStop">{{ isRunning ? 'Stop' : 'Start' }}</button>

          <select id="intervalSelect" v-model="IntervalSelectValue" @change="IntervalSelectChanged">
            <option value="1">Log every 1 sec</option>
            <option value="5">Log every 5 sec</option>
            <option value="10">Log every 10 sec</option>
            <option value="30">Log every 30 sec</option>
            <option value="60">Log every 1 min</option>
            <option value="120">Log every 2 min</option>
            <option value="180">Log every 3 min</option>
            <option value="300">Log every 5 min</option>
          </select> 

          <input type="date" id="startDatePicker" v-model="selectedStartDate" @change="onStartDateChange">  
          <input type="date" id="endDatePicker" v-model="selectedEndDate" @change="onEndDateChange">
          <input type="text" id="searchBar" v-model="searchQuery" placeholder="Search">
          <input type="text" id="newProjectName" v-model="newProjectName" placeholder="Project name for selected"  @keyup.enter="editCheckedRows">   
          <button class="delete-button" @click="deleteCheckedRows">🗑️</button>
        </div>    

      </div>

      <table>
        <thead>
          <tr>
            <th>Last Active</th>          
            <th>Duration</th>
            <th>Application</th> 
            <th>Process</th>
            <th>Project</th>
            <th><input type="checkbox" @change="toggleAll" :checked="allChecked"></th>                
          </tr>
        </thead>
        <tbody>
          <tr v-for="(process, index) in filteredProcesses" :key="index">
            <td>{{ process.EndTime || 'Undefined' }}</td>
            <td>{{ process.WindowDuration !== undefined ? formatDuration(process.WindowDuration) : 'Undefined WindowDuration' }}</td>
            <td>{{ process.ApplicationName || '' }}</td>  
            <td>{{ process.WindowName || 'Undefined WindowName' }}</td>          
            <td>
              <input v-if="editing === index" type="text" v-model="process.ProjectName" v-focus @keyup.enter="saveProcess(process, index)"/>
              <span v-else>{{ process.ProjectName }}</span>
            </td>
            <td><input type="checkbox" v-model="checkedRows" :value="index"></td>
          </tr>
        </tbody>        
      </table>

    </div>

  </div>`,
  data() {
    return {
      IntervalSelectValue: '1',
      selectedStartDate: getCurrentDate(),
      selectedEndDate: getCurrentDate(),
      isRunning: false,
      editing: null,
      newProjectName: '',
      checkedRows: [],
      processes: [],
      searchQuery: '',
    };
  },

  beforeCreate() { },
  created() {
    this.fetchProcessList();
    this.processes = this.getInitialProcesses();
  },
  beforeMount() { },
  mounted() { },
  beforeUpdate() { },
  updated() { },
  beforeDestroy() {
    window.ipc.off('process-list', this.updateProcessList);
    window.ipc.off('process-list-error', this.handleProcessListError);
  },
  destroyed() { },

  computed: {

    totalDuration() {
      const totalMs = this.filteredProcesses.reduce((total, process) => total + (process.WindowDuration || 0), 0);
      return this.formatDuration(totalMs);
    },

    allChecked() {
      return this.processes.length === this.checkedRows.length;
    },

    filteredProcesses() {
      if (!this.searchQuery) {
        return this.processes;
      }
      const searchLowerCase = this.searchQuery.toLowerCase();
      return this.processes.filter(process => {
        return process.WindowName.toLowerCase().includes(searchLowerCase)
          || process.ApplicationName.toLowerCase().includes(searchLowerCase)
          || (process.ProjectName && process.ProjectName.toLowerCase().includes(searchLowerCase));
      });
    },

    summaryProjects() {
      let projects = {};
      this.filteredProcesses.forEach(process => {
        if (process.ProjectName) {
          if (!projects[process.ProjectName]) {
            projects[process.ProjectName] = { name: process.ProjectName, totalDuration: 0 };
          }
          projects[process.ProjectName].totalDuration += process.WindowDuration;
        }
      });
      let summary = Object.values(projects);
      return summary.sort((a, b) => b.totalDuration - a.totalDuration);
    },

    processWithoutProjectNameDuration() {
      let totalDuration = 0;
      this.filteredProcesses.forEach(process => {
        if (!process.ProjectName) {
          totalDuration += process.WindowDuration;
        }
      });
      return totalDuration;
    },

    totalEarnings() {
      const totalMs = this.filteredProcesses.reduce((total, process) => total + (process.WindowDuration || 0), 0);
      const minuteRate = this.processes[0]?.HourlyRate / 60 || 0;
      const totalMinutes = totalMs / 60000;
      return (totalMinutes * minuteRate).toFixed(2);
    },
  },

  methods: {

    isTodayWorkDay() {
      let currentDate = new Date();
      return currentDate.getDay() >= 1 && currentDate.getDay() <= 5;
    },

    fetchProcessList() {
      window.ipc.send('fetch-process-list');
      window.ipc.on('process-list', (data) => {
        this.processes = data;
        console.log(this.processes[0].HourlyRate)
      });
      window.ipc.on('process-list-error', (error) => {
        console.error('Error occurred while fetching the process list:', error);
      });
    },

    getInitialProcesses() {
      return [
        { id: 1, selected: false, },
      ];
    },

    updateProcessList(data) {
      this.processes = data.map(process => ({ ...process, selected: false }));
    },

    handleProcessListError(error) {
      console.error('Error occurred while fetching the process list:', error);
    },

    IntervalSelectChanged() {
      window.ipc.send('interval-value-changed', parseInt(this.IntervalSelectValue));
    },

    onStartDateChange() {
      let parts = this.selectedStartDate.split('-');
      let formattedDate = `${parts[2]}.${parts[1]}.${parts[0]}`;
      window.ipc.send('start-date-changed', formattedDate);
    },

    onEndDateChange() {
      let parts = this.selectedEndDate.split('-');
      let formattedDate = `${parts[2]}.${parts[1]}.${parts[0]}`;
      window.ipc.send('end-date-changed', formattedDate);
    },

    toggleStartStop() {
      this.isRunning = !this.isRunning;
      window.ipc.send('toggle-start-stop', this.isRunning);

      if (!this.isRunning) {
        window.ipc.off('process-list', this.updateProcessList);
        window.ipc.off('process-list-error', this.handleProcessListError);
      } else {
        window.ipc.on('process-list', this.updateProcessList);
        window.ipc.on('process-list-error', this.handleProcessListError);
      }
    },

    toggleAll(event) {
      this.checkedRows = event.target.checked ? this.processes.map((_, index) => index) : [];
    },

    editProcess(index) {
      this.editing = index;
    },

    editCheckedRows() {
      this.checkedRows.forEach(index => {
        this.processes[index].ProjectName = this.newProjectName;
        window.ipc.send('edit-process', {
          oldWindowName: this.processes[index].WindowName,
          newProject: this.newProjectName,
          EndTime: this.processes[index].EndTime
        });
      });
      this.newProjectName = '';
      this.checkedRows = [];
    },

    deleteProcess(process) {
      if (window.confirm('Are you sure you want to delete this process?')) {
        window.ipc.send('delete-process', process);
      }
    },

    deleteCheckedRows() {
      if (window.confirm('Are you sure you want to delete these processes?')) {
        this.checkedRows.forEach(index => {
          const process = this.processes[index];
          window.ipc.send('delete-process', process);
        });
      };
      this.checkedRows = [];
    },

    saveProcess(process, index) {
      const oldWindowName = this.processes[index].WindowName;
      this.processes[index].ProjectName = process.ProjectName;
      this.editing = null;
      window.ipc.send('edit-process', { oldWindowName, newProject: process.ProjectName, EndTime: process.EndTime });
    },

    formatDuration(ms) {
      const milliseconds = ms % 1000;
      const seconds = Math.floor((ms / 1000) % 60);
      const minutes = Math.floor((ms / (1000 * 60)) % 60);
      const hours = Math.floor((ms / (1000 * 60 * 60)));

      let formattedDuration = '';

      if (hours > 0) {
        formattedDuration += `${hours}h `;
      };
      if (hours || minutes > 0) {
        formattedDuration += `${minutes}m `;
      };
      if (hours || minutes || seconds > 0) {
        formattedDuration += `${seconds}s `;
      };
      if (ms < 1000) {
        formattedDuration += `${milliseconds}ms`;
      };
      return formattedDuration.trim();
    },
  },
});
new Vue({
  el: '#app'
});