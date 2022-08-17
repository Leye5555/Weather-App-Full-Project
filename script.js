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
const API_KEY = '7674c75fd50360698efc068b5f2eefa2';
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
      nextDataSet.day1 = each;
    } else if (Number(days) === 2 && !nextDataSet.day3) {
      nextDataSet.day2 = each;
    } else if (Number(days) === 3 && !nextDataSet.day4) {
      nextDataSet.day3 = each;
    } else if (Number(days) === 4 && !nextDataSet.day5) {
      nextDataSet.day4 = each;
    } else if (Number(days) === 5 && !nextDataSet.day5) {
      nextDataSet.day5 = each;
    }
  });
  nextDataSet = { ...nextDataSet, day0: currentWeather };
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
  const allIcons = document.querySelectorAll('.icons');
  const currentIcon = document.getElementById('current-icon');
  const allCardTitles = document.querySelectorAll('.card-title');
  const currentDate = document.querySelector('.currentDate');
  const currentTemp = document.querySelector('.currentTemp');
  const currentWind = document.querySelector('.currentWind');
  const currentHumidity = document.querySelector('.currentHumidity');
  const allCardTemp = document.querySelectorAll('.temp');
  const allCardWind = document.querySelectorAll('.wind');
  const allCardHumid = document.querySelectorAll('.humidity');

  let history = window.localStorage.getItem('history');
  history = history !== null ? JSON.parse(history) : [];
  if (window.localStorage.getItem('active-id') != null) {
    history = history.filter(
      (item) =>
        Number(item.id) === Number(window.localStorage.getItem('active-id'))
    );
  }

  currentDate.textContent = `${history[0]?.name} (${
    obj.day0.dt_txt.split(' ')[0]
  })`;
  // current day forecast
  currentIcon.setAttribute(
    'src',
    `http://openweathermap.org/img/wn/${history[0]?.nextDataSet.day0.weather[0].icon}@2x.png`
  );
  currentIcon.setAttribute(
    'alt',
    history[0]?.nextDataSet.day0.weather[0].description
  );
  currentTemp.textContent = `${history[0]?.nextDataSet.day0.main.temp}`;
  currentWind.textContent = `${history[0]?.nextDataSet.day0.wind.speed}`;
  currentHumidity.textContent = `${history[0]?.nextDataSet.day0.main.humidity}`;

  // 5-day forecast
  allIcons.forEach((each, idx) => {
    for (let key in obj) {
      if (Number(key.replace('day', '')) === idx + 1) {
        each.setAttribute(
          'src',
          `http://openweathermap.org/img/wn/${obj[key].weather[0].icon}@2x.png`
        );
        each.setAttribute('alt', obj[key].weather[0].description);
      }
    }
  });

  allCardTitles.forEach((each, idx) => {
    for (let key in obj) {
      if (Number(key.replace('day', '')) === idx + 1)
        each.textContent = obj[key].dt_txt.split(' ')[0];
    }
  });
  allCardTemp.forEach((each, idx) => {
    for (let key in obj) {
      if (Number(key.replace('day', '')) === idx + 1) {
        each.textContent = obj[key].main.temp;
      }
    }
  });
  allCardTemp.forEach((each, idx) => {
    for (let key in obj) {
      if (Number(key.replace('day', '')) === idx + 1) {
        each.textContent = obj[key].main.temp;
      }
    }
  });
  allCardWind.forEach((each, idx) => {
    for (let key in obj) {
      if (Number(key.replace('day', '')) === idx + 1) {
        each.textContent = obj[key].wind.speed;
      }
    }
  });
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
