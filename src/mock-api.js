import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const mock = new MockAdapter(axios);

const seats = [
  { id: 1, floor: 1, number: 1, employeeId: '12006' },
  { id: 2, floor: 1, number: 2, employeeId: null },
  { id: 3, floor: 1, number: 3, employeeId: null },
  { id: 4, floor: 1, number: 4, employeeId: null },
  { id: 5, floor: 2, number: 1, employeeId: null },
  { id: 6, floor: 2, number: 2, employeeId: '16142' },
  { id: 7, floor: 2, number: 3, employeeId: null },
  { id: 8, floor: 2, number: 4, employeeId: null },
  { id: 9, floor: 3, number: 1, employeeId: '13040' },
  { id: 10, floor: 3, number: 2, employeeId: '17081' },
  { id: 11, floor: 3, number: 3, employeeId: null },
  { id: 12, floor: 3, number: 4, employeeId: '11221' },
  { id: 13, floor: 4, number: 1, employeeId: null },
  { id: 14, floor: 4, number: 2, employeeId: null },
  { id: 15, floor: 4, number: 3, employeeId: '16722' },
  { id: 16, floor: 4, number: 4, employeeId: null }
];

const employees = [
  { id: '12006', name: 'Alice' },
  { id: '16142', name: 'Bob' },
  { id: '13040', name: 'Charlie' },
  { id: '17081', name: 'David' },
  { id: '11221', name: 'Eve' },
  { id: '16722', name: 'Frank' }
];

mock.onGet('/api/seats').reply(200, seats);

mock.onGet('/api/employees').reply(200, employees);

mock.onPost('/api/seats/assign').reply(config => {
  const { employeeId, seatId } = JSON.parse(config.data);
  const seat = seats.find(s => s.id === seatId);
  if (seat) {
    seat.employeeId = employeeId;
  }
  return [200, seat];
});

export default mock;
