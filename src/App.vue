<template>
  <div id="app">
    <div v-for="floor in getFloors()" :key="floor" class="floor-container">
      <div class="seat-container">
        <div v-for="seat in getSeatsByFloor(floor)" :key="seat.floorSeatSeq" class="seat" :class="getSeatClass(seat)"
             @click="selectSeat(seat)">
          {{ floor }}樓: 座位{{ seat.seatNo }}
          <span v-if="getEmployeeForSeat(seat)">[員編:{{ getEmployeeForSeat(seat).empId }}]</span>
        </div>
      </div>
    </div>
    <div class="status-indicators">
      <div class="indicator available">空位</div>
      <div class="indicator occupied">已佔用</div>
      <div class="indicator selected">選擇中</div>
    </div>
    <div class="controls">
      <label>選擇員工:</label>
      <select v-model="selectedEmployeeId">
        <option value="">請選擇員工</option>
        <option v-for="employee in employees" :key="employee.empId" :value="employee.empId">
          {{ employee.name }}
        </option>
      </select>
    </div>
    <button @click="assignSeat" :disabled="!canAssign">分配座位</button>
    <button @click="clearSeat" :disabled="!canClear">清除座位</button>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const apiEndpoints = {
  seating: {
    getByFloor: (floor) => `${API_BASE_URL}/seating/floor/${floor}`,
    assign: `${API_BASE_URL}/seating/assign`,
    clear: `${API_BASE_URL}/seating/clear`,
  },
  employees: {
    getAll: `${API_BASE_URL}/employees`,
  },
};

export default {
  name: 'SeatingChart',
  setup() {
    const seats = ref([]);
    const employees = ref([]);
    const selectedEmployeeId = ref('');
    const selectedSeatSeq = ref(null);

    const getFloors = () => {
      return [...new Set(seats.value.map(seat => seat.floorNo))].sort((a, b) => a - b);
    };

    const getSeatsByFloor = (floor) => {
      return seats.value.filter(seat => seat.floorNo === floor).sort((a, b) => a.seatNo - b.seatNo);
    };

    const getSeatClass = (seat) => {
      if (selectedSeatSeq.value === seat.floorSeatSeq) {
        return 'selected';
      } else if (getEmployeeForSeat(seat)) {
        return 'occupied';
      } else {
        return 'available';
      }
    };

    const selectSeat = (seat) => {
      const employee = getEmployeeForSeat(seat);
      if (employee) {
        selectedSeatSeq.value = seat.floorSeatSeq;
        selectedEmployeeId.value = employee.empId;
      } else {
        selectedSeatSeq.value = seat.floorSeatSeq;
        selectedEmployeeId.value = '';
      }
    };

    const getEmployeeForSeat = (seat) => {
      return employees.value.find(emp => emp.seat && emp.seat.floorSeatSeq === seat.floorSeatSeq);
    };

    const canAssign = computed(() => {
      return selectedEmployeeId.value && selectedSeatSeq.value;
    });

    const canClear = computed(() => {
      return selectedSeatSeq.value && seats.value.find(seat => seat.floorSeatSeq === selectedSeatSeq.value)?.employee;
    });

    const assignSeat = async () => {
      if (canAssign.value) {
        try {
          await axios.post(apiEndpoints.seating.assign, null, {
            params: {
              empId: selectedEmployeeId.value,
              floorSeatSeq: selectedSeatSeq.value
            }
          });
          await fetchSeats();
          selectedEmployeeId.value = '';
          selectedSeatSeq.value = null;
        } catch (error) {
          console.error("分配座位時出錯:", error);
          alert("分配座位失敗，請稍後再試。");
        }
      }
    };

    const clearSeat = async () => {
      if (canClear.value) {
        try {
          await axios.post(apiEndpoints.seating.clear, null, {
            params: {
              floorSeatSeq: selectedSeatSeq.value
            }
          });
          await fetchSeats();
          selectedEmployeeId.value = '';
          selectedSeatSeq.value = null;
        } catch (error) {
          console.error("清除座位時出錯:", error);
          alert("清除座位失敗，請稍後再試。");
        }
      }
    };

    const fetchSeats = async () => {
  try {
    const floors = [1, 2, 3, 4];
    const allSeats = [];
    for (const floor of floors) {
      const response = await axios.get(apiEndpoints.seating.getByFloor(floor));
      allSeats.push(...response.data);
    }
    seats.value = allSeats.map(seat => ({
      ...seat,
      employee: employees.value.find(emp => emp.seat && emp.seat.floorSeatSeq === seat.floorSeatSeq) || null
    }));
    console.log("Seats updated:", seats.value); // 日誌更新的 seats
  } catch (error) {
    console.error("Error fetching seats:", error.message);
  }
};


    const fetchEmployees = async () => {
      try {
        const url = apiEndpoints.employees.getAll;
        const response = await axios.get(url);
        employees.value = response.data;
      } catch (error) {
        if (error.response) {
          console.error("Error fetching employees:", error.response.status, error.response.data);
          alert(`獲取員工資訊失敗: ${error.response.status} ${error.response.data}`);
        } else if (error.request) {
          console.error("Error fetching employees: No response received", error.request);
          alert("請求未收到響應，請檢查網絡連接。");
        } else {
          console.error("Error fetching employees:", error.message);
          alert(`獲取員工資訊失敗: ${error.message}`);
        }
      }
    };

    watch(seats, () => {
      console.log("Seats updated:", seats.value);
    });

    onMounted(async () => {
    await fetchEmployees();
    await fetchSeats();
    });


    return {
      seats,
      employees,
      selectedEmployeeId,
      selectedSeatSeq,
      getFloors,
      getSeatsByFloor,
      getSeatClass,
      selectSeat,
      assignSeat,
      getEmployeeForSeat,
      clearSeat,
      canAssign,
      canClear
    };
  }
};
</script>

<style scoped>
.floor-container {
  margin-bottom: 20px;
}

.seat-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.seat {
  width: 120px;
  height: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 12px;
  transition: all 0.3s ease;
  margin: 5px;
  text-align: center;
}

.seat span {
  font-size: 10px;
  margin-top: 2px;
}

.available {
  background-color: #f0f0f0;
  color: black;
}

.occupied {
  background-color: #ff6b6b; /* 紅色 */
  color: white;
}

.selected {
  background-color: #4ecdc4;
  color: white;
  border: 2px solid #45b7aa;
}

.status-indicators {
  display: flex;
  margin-bottom: 20px;
}

.indicator {
  margin-right: 10px;
  padding: 5px 10px;
  border-radius: 3px;
}

.controls {
  margin-top: 20px;
  margin-bottom: 10px;
}

select, button {
  margin-right: 10px;
  padding: 5px 10px;
  font-size: 16px;
}

button {
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 3px;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #45a049;
}
</style>
