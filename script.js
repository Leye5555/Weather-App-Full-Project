function setHistory(newHistory = { id: '', name: '', nextDataSet: {} }) {
  let oldHistory = window.localStorage.getItem('history') || JSON.stringify([]);
  oldHistory = JSON.parse(oldHistory);
  if (
    (newHistory.id === '' ||
      newHistory.name === '' ||
      Object.keys(newHistory.nextDataSet).length === 0) &&
    oldHistory.length >= 1
  ) {
    updateHistory();
    setForecastDisplay(newHistory.nextDataSet);
    return;
  } else {
    // set history to local storage if it exists, else end the function.
    if (oldHistory.length !== 0) {
      oldHistory = oldHistory.filter((record) => record.id !== newHistory.id);
      oldHistory.push(newHistory);
      window.localStorage.setItem('active-id', newHistory.id);
      window.localStorage.setItem('history', JSON.stringify(oldHistory));
      setForecastDisplay(newHistory.nextDataSet);
      updateHistory();
    } else if (oldHistory.length === 0 && newHistory.id !== '') {
      oldHistory.push(newHistory);
      window.localStorage.setItem('active-id', newHistory.id);
      window.localStorage.setItem('history', JSON.stringify(oldHistory));
      // these will not get called if the oldHistory is empty
      setForecastDisplay(newHistory.nextDataSet);
      updateHistory();
    }
  }

  function updateHistory() {
    const searchHistoryWrap = document.querySelector('.search-history-wrap');
    oldHistory = oldHistory.reverse().slice(0, 8);
    oldHistory.forEach((each) => {
      const historyDiv = document.querySelector('.search-history').cloneNode();
      historyDiv.setAttribute('data-id', each.id);
      // remove the .search-history-placeholder placeholder class from dynamic history.
      historyDiv.classList.remove('search-history-placeholder');
      historyDiv.textContent = `${each.name}`;
      historyDiv.addEventListener('click', () => {
        window.localStorage.setItem('active-id', each.id);
        setForecastDisplay(each.nextDataSet);
      });
      if (searchHistoryWrap.children.length === 0) {
        searchHistoryWrap.appendChild(historyDiv);
      } else {
        const newHistoryArray = Array.from(searchHistoryWrap.children).filter(
          (child) =>
            child.getAttribute('data-id') !== historyDiv.getAttribute('data-id')
        );
        //  update html history block
        searchHistoryWrap.innerHTML = '';
        newHistoryArray.forEach((child) =>
          searchHistoryWrap.appendChild(child)
        );
        searchHistoryWrap.appendChild(historyDiv);
      }
    });
    //  delete the placeholder history by selecting .search-history-placeholder.
    const placeholder = document.querySelector('.search-history-placeholder');
    if (placeholder) searchHistoryWrap.removeChild(placeholder);
  }
}
setHistory();
const API_KEY = 'c9b07e4aa36da13105ee29ef87126360';
var DateTime = luxon.DateTime;

/// search button triggers fetch request
document
  .querySelector('#search-btn')
  .addEventListener('click', async () => await fetchWeatherData());

async function fetchCoordinates() {
  let city = document.querySelector('#search').value;
  if (city === '' && window.localStorage.getItem('active-id') !== null)
    return null;
  else if (city === '' && window.localStorage.getItem('active-id') === null) {
    city = 'atlanta';
  }

  const url = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`;
  const response = await fetch(url)
    .then((res) => res.json())
    .then((json) => json)
    .catch((err) => err);
  const [data] = response;
  const { lon, lat } = data;
  return {
    lon,
    lat,
  };
}
async function fetchWeatherData() {
  const cod = await fetchCoordinates();
  if (cod === null) return;
  const { lon, lat } = cod;
  if (!lon || !lat) return;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
  const response = await fetch(url)
    .then((res) => res.json())
    .then((json) => json)
    .catch((err) => err);
  const { id, name } = response;
  if (!id) return;
  const url_forecast = `https://api.openweathermap.org/data/2.5/forecast?id=${id}&appid=${API_KEY}`;
  const forecast = await fetch(url_forecast)
    .then((res) => res.json())
    .then((json) => json)
    .catch((err) => err);
  const { list } = forecast;
  const [currentWeather] = list;
  const { dt_txt } = currentWeather;
  let nextDataSet = {};

  list.forEach((each) => {
    const forecast_date = each.dt_txt;
    let end = DateTime.fromISO(forecast_date.split(' ')[0]);
    let start = DateTime.fromISO(dt_txt.split(' ')[0]);

    let { days } = end.diff(start, 'days').toObject();
    if (Number(days) === 1 && !nextDataSet.day2) {
      nextDataSet.day2 = each;
    } else if (Number(days) === 2 && !nextDataSet.day3) {
      nextDataSet.day3 = each;
    } else if (Number(days) === 3 && !nextDataSet.day4) {
      nextDataSet.day4 = each;
    } else if (Number(days) === 4 && !nextDataSet.day5) {
      nextDataSet.day5 = each;
    } else return;
  });
  nextDataSet = { ...nextDataSet, day1: currentWeather };
  setHistory({ id, name, nextDataSet });
}

function setForecastDisplay(obj) {
  // if there is no new forecast then display active existing history
  if (Object.keys(obj).length === 0) {
    let activeId = null;
    if (window.localStorage.getItem('active-id') != null)
      activeId = Number(window.localStorage.getItem('active-id'));
    let history = null;
    if (window.localStorage.getItem('history') !== null)
      history = JSON.parse(window.localStorage.getItem('history'));
    history = history.filter((item) => Number(item.id) === activeId);
    obj = history[0].nextDataSet;
  }

  const allCardTitles = document.querySelectorAll('.card-title');
  const currentDate = document.querySelector('.currentDate');
  const currentTemp = document.querySelector('.currentTemp');
  const currentWind = document.querySelector('.currentWind');
  const currentHumidity = document.querySelector('.currentHumidity');

  let history = window.localStorage.getItem('history');
  history = history !== null ? JSON.parse(history) : [];
  if (window.localStorage.getItem('active-id') != null) {
    history = history.filter(
      (item) =>
        Number(item.id) === Number(window.localStorage.getItem('active-id'))
    );
  }

  currentDate.textContent = `${history[0]?.name} (${
    obj.day1.dt_txt.split(' ')[0]
  })`;
  currentTemp.textContent = `${history[0]?.nextDataSet.day1.main.temp}`;
  currentWind.textContent = `${history[0]?.nextDataSet.day1.wind.speed}`;
  currentHumidity.textContent = `${history[0]?.nextDataSet.day1.main.humidity}`;

  allCardTitles.forEach((each, idx) => {
    for (let key in obj) {
      if (Number(key.replace('day', '')) === idx + 1)
        each.textContent = obj[key].dt_txt.split(' ')[0];
    }
  });
  const allCardTemp = document.querySelectorAll('.temp');
  allCardTemp.forEach((each, idx) => {
    for (let key in obj) {
      if (Number(key.replace('day', '')) === idx + 1) {
        each.textContent = obj[key].main.temp;
      }
    }
  });
  const allCardWind = document.querySelectorAll('.wind');
  allCardWind.forEach((each, idx) => {
    for (let key in obj) {
      if (Number(key.replace('day', '')) === idx + 1) {
        each.textContent = obj[key].wind.speed;
      }
    }
  });
  const allCardHumid = document.querySelectorAll('.humidity');
  allCardHumid.forEach((each, idx) => {
    for (let key in obj) {
      if (Number(key.replace('day', '')) === idx + 1) {
        each.textContent = obj[key].main.humidity;
      }
    }
  });
}

// call fetch weather data to kickstart the project as long as there is no active city id.
if (window.localStorage.getItem('active-id') === null) fetchWeatherData();
