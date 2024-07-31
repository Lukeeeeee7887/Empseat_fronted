<template>
  <div id="app">
    <div v-if="loading">載入中...</div>
    <template v-else>
      <div v-for="floor in getFloors()" :key="floor" class="floor-container">
        <div class="seat-container">
          <div v-for="seat in getSeatsByFloor(floor)" :key="seat.floorSeatSeq" 
               class="seat" :class="getSeatClass(seat)"
               @click="selectSeat(seat)">
            {{ floor }}樓: 座位{{ seat.seatNo }}
            <span v-if="seat.employee">[員編:{{ seat.employee.empId }}]</span>
          </div>
        </div>
      </div>
      <div class="status-indicators">
        <div class="indicator available">可選擇</div>
        <div class="indicator occupied">已分配</div>
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
    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { apiEndpoints } from './api';

export default {
  name: 'SeatingChart',
  setup() {
    const seats = ref([]);
    const employees = ref([]);
    const selectedEmployeeId = ref('');
    const selectedSeatSeq = ref(null);
    const loading = ref(true);

    const getFloors = () => [...new Set(seats.value.map(seat => seat.floorNo))].sort((a, b) => a - b);
    const getSeatsByFloor = (floor) => seats.value.filter(seat => seat.floorNo === floor).sort((a, b) => a.seatNo - b.seatNo);
    const getSeatClass = (seat) => {
      if (selectedSeatSeq.value === seat.floorSeatSeq) return 'selected';
      return seat.employee ? 'occupied' : 'available';
    };
    const selectSeat = (seat) => {
      selectedSeatSeq.value = seat.floorSeatSeq;
    };

    const canAssign = computed(() => selectedEmployeeId.value && selectedSeatSeq.value);
    const canClear = computed(() => {
      const selectedSeat = seats.value.find(seat => seat.floorSeatSeq === selectedSeatSeq.value);
      return selectedSeat && selectedSeat.employee;
    });

    const fetchData = async () => {
      loading.value = true;
      try {
        const [employeesResponse, ...floorResponses] = await Promise.all([
          axios.get(apiEndpoints.employees.getAll),
          ...([1, 2, 3, 4].map(floor => axios.get(apiEndpoints.seating.getByFloor(floor))))
        ]);

        employees.value = employeesResponse.data;
        seats.value = floorResponses.flatMap(response => response.data);

        seats.value = seats.value.map(seat => ({
          ...seat,
          employee: employees.value.find(emp => emp.seat && emp.seat.floorSeatSeq === seat.floorSeatSeq) || null
        }));
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('獲取數據失敗，請稍後再試。');
      } finally {
        loading.value = false;
      }
    };

    const assignSeat = async () => {
      if (canAssign.value) {
        try {
          await axios.post(apiEndpoints.seating.assign, null, {
            params: { empId: selectedEmployeeId.value, floorSeatSeq: selectedSeatSeq.value }
          });
          await fetchData();
          selectedSeatSeq.value = null;
          selectedEmployeeId.value = '';
        } catch (error) {
          console.error('分配座位時出錯:', error);
          alert('分配座位失敗，請稍後再試。');
        }
      }
    };

    const clearSeat = async () => {
      if (canClear.value) {
        try {
          await axios.post(apiEndpoints.seating.clear, null, {
            params: { floorSeatSeq: selectedSeatSeq.value }
          });
          await fetchData();
          selectedSeatSeq.value = null;
        } catch (error) {
          console.error('清除座位時出錯:', error);
          alert('清除座位失敗，請稍後再試。');
        }
      }
    };

    onMounted(fetchData);

    return {
      seats, employees, selectedEmployeeId, selectedSeatSeq,
      loading, getFloors, getSeatsByFloor, getSeatClass, selectSeat,
      assignSeat, clearSeat, canAssign, canClear
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
