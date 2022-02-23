"use strict";

let detailsMap;
let sidesList = [];
let sides = [];
let selected = [];
let pois = [];
let placemarks = {};
let clusterer;
let myMap;
let distThreshold = 1000;
let poiLastQuery;

function debug(args) {
  console.log("[DEBUG] " + args)
}

function selectPoi () {

}

let sideCandidates = [];
function handlePoiCheckbox(id, checked){
  for(let poi of pois.items) {
    if (poi._values.id == id) {
      for(let side of sides) {
        let dist = distance(side.location[0], side.location[1], poi._values.coordinates[1], poi._values.coordinates[0])
        if(dist < distThreshold) {
          if(!checked){
          const index = sideCandidates.indexOf(side);
          if (index > -1) {
            sideCandidates.splice(index, 1);
          }
        }
        else {
          sideCandidates.push(side)
        }
        }
      }
    }
  }
  console.log(sideCandidates)
}

$('#showSides').on('click', function() {
  if(sideCandidates.length == 0){
    alert('Выберите хотя-бы один объект PoI!')
    return
  }
  setPoiBtn(true)
  sidesList.remove()
  sidesList.add([...new Set(sideCandidates)])
    //$('.panel-selector').attr('class', 'panel-selector')
    //showSides.className = 'bottom-button search-selector outline';
  $('.panel-selector').attr('class', 'panel-selector')
  searchSelector.className += ' active'
  $('.panel-wrapper').attr('class', 'panel-wrapper')
  $('#' + this.getAttribute('data-panel')).attr('class', 'panel-wrapper active')
})

function distance(lat1, lon1, lat2, lon2) {
  if ((lat1 == lat2) && (lon1 == lon2)) return 0;
  let radlat1 = Math.PI * lat1/180;
  let radlat2 = Math.PI * lat2/180;
  let theta = lon1-lon2;
  let radtheta = Math.PI * theta/180;
  let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  if (dist > 1) {
    dist = 1;
  }
  dist = Math.acos(dist);
  dist = dist * 180/Math.PI;
  dist = dist * 60 * 1.1515;
  dist = dist * 1.609344 * 1000;
  return dist;
}

function setSide(board, index){ // Обновляет контент балуна и окон с информацией
  debug('Called setSide!')
  // Обновлем информацию
  params.set('side', board.id + board.sides[index])
  updateUrl()
  $(".current-image").attr("src", board.images[index]);
  $('.current-title').text(board.address)
  $('.point-meta').html('Тип: Билборд 6x3' +
                   '<br>ID: ' + board.id +
                   '<br>Сторона: ' + board.sides[index]
                   + '<div class="point-button-row"></div>')
  let isSelected;
  for(let side of selected.visibleItems){
    if(side._values.id == (board.id + board.sides[index]))
      isSelected = true;
  }
  $(".is-selected-button").text(isSelected ? 'Удалить из выборки' : 'Добавить в выборку')
  $(".is-selected-button").off('click')
  if(!isSelected) $(".is-selected-button").on('click', () => selectSide(getById(board.id + board.sides[index])))
  else $(".is-selected-button").on('click', () => deselectSide(getById(board.id + board.sides[index])))
  $(".is-selected-button").on('click', () => setSide(board, index))
  // Добавляем кнопки выбора сторон 
  for(let element of document.getElementsByClassName('point-button-row')){
    element.innerHTML = "";
    for(let j = 0; j < board.sides.length; j++){
      element.innerHTML += 
        '<button side_id="' + j + '" class="side-button ' + (j == index ? 'selected' : '') + '">' + board.sides[j] + '</button>';
    }
  }
  // Добавляем обработчики кнопкам
  $('.side-button').on('click', function () {
    setSide(board, $(this).attr('side_id'))
  });
  $('.button-select').on('click', function () {
    setBackdrop(true);
    setInfo(true);
  });
  // Обновляем статическую карту в окне с информацией
  let coordinates = board.location[1] + ',' +  board.location[0] // API требует перевернутых координат ¯\_(ツ)_/¯
  document.querySelector('.map-img').src = 
      "https://static-maps.yandex.ru/1.x/?l=map&ll=" + coordinates + "&z=10&size=650,340&pt=" + coordinates + ",pm2dgm"
  // Обновляем динамическую карту в окне с информацией
  detailsMap.geoObjects.removeAll(); 
  detailsMap.setCenter(board.location, 13);
  detailsMap.geoObjects.add(new ymaps.Placemark(board.location, {
    balloonContent: board.address,
  }));
}

function updateSelectedCount () {
  selectedCount.textContent = "Выборка (" + selected.visibleItems.length + ")"
}

function selectSide (side) { // Добавлет сторону в выборку
  selected.add(side)
  document.getElementById('search').querySelector('#id' + side.id).querySelector('input').checked = true
  updateSelectedCount()
}

function deselectSide (side) { // Удаляет сторону из выборки
  document.getElementById('search').querySelector('#id' + side.id).querySelector('input').checked = false
  console.log(side)
  selected.remove('id', side.id)
  updateSelectedCount()
}

function getById(id) { // Возвращает сторону по ID вида id16А
  for(let side of sides){
    if(side.id == id) return side;
  }
}

function handleCheckbox(id, checked) { // Обрабатывает нажатие на чекбокс в списке сторон 
  let side = getById(id)
  side.selected = true
  if(checked) selectSide(side)
  else deselectSide(side)
  updateUrl()
}

function updateUrl() {
  let ids = []
  for(let side of selected.visibleItems){
    ids.push(side.values().id)
  }
  params.set('selected', ids.toString())
  window.history.pushState({}, null, location.protocol + '//' + location.host + location.pathname + '?' + params.toString());
}

function setBackdrop(show) { // Устанавливает видимость темного фона для окна с информацией
  let backdrop = document.querySelector("#backdrop")
  if (show) backdrop.className = 'backdrop-active' 
  else backdrop.className = 'backdrop'
}


function setInfo(show){ // Устанавливает видимость окна с информацией
  params.set('info', show)
  updateUrl();
  setBackdrop(show)
  let info = document.querySelector("#info")
  if (show) info.className += ' active'
  else info.className = "info fadein"
}

function setDetails(show) { // Устанавливает видимость полноэкранного окна с информацией
  params.set('details', show)
  updateUrl();
  setBackdrop(show)
  setInfo(false);
  setBackdrop(false);
  let details = document.querySelector("#details")
  if (show) details.className += ' active'
  else details.className = details.className.replace('active', '')
}

function setPoiBtn(show) {
  if(show) resetPoi.className += ' button-active'
  else resetPoi.className = resetPoi.className.replace('button-active', '')
}

function showOnMap(side) { // Приближает карту и открывает балун переданной стороны
  console.log(side.location)
  myMap.setCenter(side.location, 17, {
  }).then(() => {placemarks[side.location].balloon.open().then(() => setSide(side.board, side.board.sides.indexOf(side.side)))});
}

function initDetailsMap() { // Инициализирует карту в окне с информацией 
  detailsMap = new ymaps.Map("map-details", {
      center: [59.9, 30.3],
      zoom: 7
  });
}


$('.panel-selector').on('click', function () { // Обработчик выбора бокового окна (поиск, выборка, poi)
  $('.panel-selector').attr('class', 'panel-selector')
  this.className += ' active';
  $('.panel-wrapper').attr('class', 'panel-wrapper')
  $('#' + this.getAttribute('data-panel')).attr('class', 'panel-wrapper active')
})

$('#backdrop').on('click', function () { // Закрываем окно с информацией при клике на темный фон 
  setBackdrop(false);
  setInfo(false);
})

$('.details-open-button').on('click', function () {
  setDetails(true);
})

$('.details-close-button').on('click', function () {
  setDetails(false);
  setBackdrop(false)
  setInfo(false)
})


let poi_coordinates = []

poiSearchInput.addEventListener('input', getPOI);

let boardLayout =
  '<div class = "point-container">' +
    '<a class="point-title current-title"></a>' +
    '<div class="point-description">' +
      '<img class="point-image current-image" src=""/>' +
      '<a class="point-meta">Тип: Билборд 6x3<br>ID: 24А<br>Сторона: А<br>'+ 
        '<div class="point-button-row"></div>'+
      '</a>' +
    '</div>' +
    '<div class="point-bottom-row">' +
      '<button class="bottom-button is-selected-button" style="width: 200px;"></button>' +
      '<button class="bottom-button open button-select">Подробнее</button>' +
    '</div>' +
  '</div>';

async function loadBanners(){
  let response = await fetch('https://elvispiter.github.io/elvis.json')
  let boards = await response.json()
  for(let board of boards){
    // Создаем точку
    let placemark = new ymaps.Placemark(board.location, {
      balloonContent: boardLayout,
    }, {
      preset: 'islands#nightIcon', // Стиль иконки
      //openEmptyBalloon: true
    });
    placemarks[board.location] = placemark
    // Вызываем функцию при клике на балун
    placemark.events.add('balloonopen', function (e) {
      document.getElementById('id' + board.id + board.sides[0]).scrollIntoView()
      document.getElementById('panel-selector-container').scrollIntoView() // needed for mobile
        setSide(board, 0);
    });
    // Добавляем точку в кластеризатор
    clusterer.add(placemark)
    // Достаем точки 
    for(let index = 0; index < board.sides.length; index++){
      let side = Object()
      side.side = board.sides[index]
      side.address = board.address
      side.id = board.id + board.sides[index]
      side.board = board
      side.image = board.images[index]
      side.location = board.location
      sides.push(side)
      if(side.id == preload.side) setTimeout(() => showOnMap(side), 1000);
      //else console.log(side.id, preload.side, side.id == preload.side)
    }
  }
  sidesList.add(sides)
  // Сортируем по 
  sidesList.sort("id", {order: "asc"})
  // Добавляем кластеризатор на карту
  myMap.geoObjects.add(clusterer);
  myMap.setBounds(clusterer.getBounds(), {
      checkZoomRange: false
  });
}

let options = {
  valueNames: [ 'address', 'side', 'id', 'selected'],
  item: function (side) {
    let checked =  ''
    if(side.selected) checked = 'checked '
    return '<a class="list__item" id="id'+ side.id +'" >' +
    '<div class="item-info">' +
      '<div class="address" onclick="showOnMap(getById(\''+side.id+'\'))"></div>' +
      '<div class="tags meta">' +
        '<label class="custom-checkbox">' +
          '<input type="checkbox"'+ checked +'onclick="handleCheckbox(\''+ side.id +'\', this.checked)">' +
          '<span></span>' +
        '</label>' +
        '<div class="tag">Сторона ' + side.side + '</div>' +
        '<div class="id"></div>' +
      '</div>' +
    '</div>' +
    '</a>'
  }
};
let optionsPOI = {
  valueNames: [ 'description', 'name', 'distance', 'selected', 'location'],
  item: function (poi) {
    return '<a class="list__item" id="id'+ poi.id +'" >' +
    '<div class="item-info">' +
      '<div class="description address" onclick="myMap.setCenter(['+ poi.coordinates[1] + ',' + poi.coordinates[0] + '], 13);"></div>' +
      '<div class="tags meta">' +
        '<label class="custom-checkbox">' +
          '<input id=btn' + poi.id + ' type="checkbox" class="select-poi" onclick="handlePoiCheckbox(\''+ poi.id +'\', this.checked)">' +
          '<span></span>' +
        '</label>' +
        '<div class="tag name color-button-2"></div>' +
        //'<div class="">'+ poi.distance +' м. от 🚩</div>' +
        '<div class="">'+ poi.distance +'м. от <img src="https://static.thenounproject.com/png/19719-200.png" style="height: 1em;"></img></div>' +
        '</div>' +
    '</div>' +
    '</a>'
  }
};

async function initLists (){
  sidesList = new List('search', options, [])
  selected = new List('selected', options, [])
  pois = new List('poi-list', optionsPOI, [])
  selected.sort("id", {order: "desc"})
  var $count = $('.count')
  $count.append(sidesList.size());
  sidesList.on('filterComplete', function(){
    $count.text(sidesList.update().matchingItems.length);
  });

} 

function createFilters () {
  $('.filter').on('click', function(){
    var $q = $(this).attr('data-filter');
    if($(this).hasClass('active')){
      //sidesList.filter();
      $('.filter').removeClass('active');
    } else {
      //sidesList.filter(function(item) {
      //  return (item.values().date == $q);
      //});
      $('.filter').removeClass('active');
      $(this).addClass('active');
    }
  })
  $('.side-filter').on('click', function() {
    let letter = this.getAttribute('data-filter')
    if($(this).hasClass('active')) sidesList.filter(function(item) {
      return (item.values().id.includes(letter))
    }); 
    else sidesList.filter()
  })
  $('.distance-filter').on('click', function () {
    distThreshold = Number(this.getAttribute('data-filter'))
    console.log(distThreshold)
    if(poiLastQuery.length > 2) getPOI(null, poiLastQuery)
  })
}

$('#resetPoi').on('click', function () {
  sidesList.remove()
  sidesList.add(sides)
  setPoiBtn(false)
})

async function getPOI(event, query = false) {
  if(!query){
    let form = event.srcElement
    let value = form.value
    if(value.length < 3) pois.clear()
    await new Promise(r => setTimeout(r, 500));
    if(form.value != value || value.length < 3) return
    query = event.target.value
  }
  sideCandidates = []
  poiLastQuery = query;
  let response = await fetch("https://search-maps.yandex.ru/v1/?apikey=5c9ccb05-ffe4-42fe-b2a6-114dd46e632c&text=" + query + "&bbox=27.696353,61.200687~33.950239,58.379111&lang=ru_RU&results=500")
  let json = await response.json()
  myMap.geoObjects.removeAll();
  clusterer.removeAll();
  myMap.geoObjects.add(clusterer);
  //myMap.setCenter
  let poisBuff = []
  for (var i = 0; i < json.features.length; i++) {
    let poi = Object();
    poi.id = json.features[i].properties.CompanyMetaData.id
    poi.name =  json.features[i].properties.name
    poi.description = json.features[i].properties.description
    poi.coordinates = json.features[i].geometry.coordinates
    poi.location = json.features[i].geometry.coordinates.join(',')
    let minDist = Infinity;
    let banners = [];
    for(let side of sides){
      let dist = distance(side.location[0], side.location[1], poi.coordinates[1], poi.coordinates[0])
      if(dist < minDist) minDist = dist;
      if(dist < distThreshold) {
        if(!banners.includes(side.board)){
          banners.push(side.board)
          let placemark = new ymaps.Placemark(side.board.location, {
            balloonContent: boardLayout,
          }, {
            preset: 'islands#nightIcon', // Стиль иконки
            //openEmptyBalloon: true
          });
          placemarks[side.board.location] = placemark
          placemark.events.add('balloonopen', function (e) {
              setSide(side.board, 0);
          });
          myMap.geoObjects.add(placemark)
        }
        poi.distance = Math.round(minDist)
      }
    }
    //$('#btn' + poi.id).on('click', function () {
    //  console.log(banners)
    //})
    if(minDist < distThreshold) {
      myMap.geoObjects.add(new ymaps.Placemark(poi.coordinates.slice().reverse(), {
      balloonContent: poi.name + ', ' + poi.description
      }, {
          preset: 'islands#circleDotIcon',
          iconColor: 'red'
      })); poisBuff.push(poi);
    }}
  pois.remove()
  pois.add(poisBuff)
  pois.sort("distance")
}
let params;
let preload = Object();

ymaps.ready(function () {
      initDetailsMap()
      params = new URLSearchParams(window.location.search);
      preload.side = params.get('side')
      // Создаем карту
      myMap = new ymaps.Map('map', {
          center: [59.9, 30.3],
          zoom: 12,
          behaviors: ['default', 'scrollZoom']
      }, {
          searchControlProvider: 'yandex#search'
      });
      
      // Создаем кластеризатор
      clusterer = new ymaps.Clusterer({
          preset: 'islands#nightClusterIcons',
          clusterHideIconOnBalloonOpen: false,
          geoObjectHideIconOnBalloonOpen: false
      });

      async function init() {
        await initLists()
        await loadBanners()
        await createFilters()
        if(params.get("info") === 'true') setInfo(true)
        if(params.get("details") === 'true') setDetails(true)
        if(params.get("selected")){
          for(let i of params.get("selected").split(','))
            selectSide(getById(i))
        }
      }

      init()
});
