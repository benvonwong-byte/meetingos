const generateAvailability = (start_date, end_date, start_time, end_time) => {
  const user_time_array = create_user_time_array_hr(
    start_date,
    end_date,
    start_time,
    end_time
  );

  const user_time = new Object();
  for (let i = 0; i < user_time_array.length; i++) {
    const timeslot = user_time_array[i];
    user_time[timeslot] = [];
  }
  return user_time;
};

const create_user_time_array_hr = (
  start_date,
  end_date,
  start_time,
  end_time
) => {
  let user_time_array = [];
  const start_timestamp = new Date(start_date).getTime() / 1000;
  const end_timestamp = new Date(end_date).getTime() / 1000;
  const timestamp_difference = end_timestamp - start_timestamp;
  const before_start = secondsConverter(start_time);
  const selected_time = secondsConverter(end_time) - before_start;
  for (let i = 0; i <= timestamp_difference / 86400; i++) {
    let x = start_timestamp + 86400 * i;
    let start_marker = x + before_start;
    let skip_marker = start_marker + selected_time;
    for (let token = start_marker; token <= skip_marker; token += 3600) {
      user_time_array.push(token);
    }
  }
  return user_time_array;
};

const secondsConverter = (time) => {
  const hour = parseInt(time.slice(0, 2) * 3600);
  const minute = parseInt(time.slice(3, 5)) * 60;
  const sum = hour + minute;
  return sum;
};

const IDGenerator = function () {
  return Math.random().toString(36).substr(2, 9);
};

const retrievePage = function (
  object,
  currentPage,
  daysPerPage,
  start_time,
  end_time
) {
  const numberOfElementsPerPage =
    daysPerPage * hrs_per_day(start_time, end_time);
  const startIndex = (currentPage - 1) * numberOfElementsPerPage;
  const endIndex = startIndex + numberOfElementsPerPage;
  const objectArray = Object.getOwnPropertyNames(object);
  if (endIndex > objectArray.length) {
    const difference = endIndex - objectArray.length;
    return objectArray.slice(startIndex, startIndex + difference);
  }
  return objectArray.slice(startIndex, endIndex);
};

module.exports = { generateAvailability, IDGenerator, retrievePage };
