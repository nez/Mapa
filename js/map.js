var AddLayerControl = function(opt_options) {
  var options = opt_options || {};
  this.active = options.active || false;

  var this_ = this;

  var handleAddLayer = function(e) {
    $("#newLayerDialog").modal("show");
  };

  // this will be the ui of the component
  var anchor = document.createElement('a');
  anchor.href = '#add-layer-button';
  anchor.innerHTML = 'Agregar capa';


  // bind to click and touchevents to support mobile
  anchor.addEventListener('click', handleAddLayer, false);
  anchor.addEventListener('touchstart', handleAddLayer, false);

  var element = document.createElement('div');
  element.className = 'ol-control draw-point ol-unselectable';
  element.appendChild(anchor);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });
};


function buildPopup(map, wmsLayer, mapView){
  // Popup
  var infoPopup = new ol.Overlay.Popup();
  map.addOverlay(infoPopup);

  map.on("singleclick", function(evt) {
    var viewResolution = /** @type {number} */ (mapView.getResolution());
    var coordinates = evt.coordinate;

    var url = wmsLayer.getGetFeatureInfoUrl(coordinates, viewResolution, "EPSG:4326", {"info_format": "application/json"});

    $.get(url, function(data){
      var featureInfo = data.features[0].properties;

      var html = "<div>";
      for(var key in featureInfo){
        html += "<small><b>" + key + "</b>: " + featureInfo[key] + "</small><br>";
      }
      html += "</div>";

      infoPopup.show(coordinates, html);
    });
  });
}





// init map
var overLayerGroup;
function buildMap(){

  // layers
  var osmLayer = new ol.layer.Tile({
    title: "OpenStreetMap tiles",
    type: "base",
    visible: true,
    source: new ol.source.OSM()
  });


  // start map view
  var mapView = new ol.View({
    projection: "EPSG:4326",
    center: [-101.9563, 23.6257],
    zoom: 5
  })

  // prepare layer groups
  var baseLayerGroup = new ol.layer.Group({
    'title': 'Mapas base',
    layers: [osmLayer]
  });

  var overLayerGroup = new ol.layer.Group({
    'title': 'Capas de datos',
    layers: []
  });

  // create map
  var map = new ol.Map({
    layers: [overLayerGroup, baseLayerGroup],
    target: "map",
    view: mapView
  });

  // prepare NEW LAYER control
  ol.inherits(AddLayerControl, ol.control.Control);
  // add the control to the map
  map.addControl(new AddLayerControl({}));


  // layers
  var layerswitcher = new ol.control.LayerSwitcher({});
  map.addControl(layerswitcher);
  layerswitcher.showPanel();

  map.addWmsLayer = function(layerId, title){
    var newWmsLayer = new ol.layer.Tile({
      title: title,
      source: new ol.source.TileWMS({
        url: 'https://geo.datos.gob.mx/geoserver/ows',
        params: {'LAYERS': "ckan:" + layerId, 'TILED': true},
        serverType: 'geoserver'
      })
    });

    map.addOverlay(newWmsLayer);
    overLayerGroup.getLayers().push(newWmsLayer);
    layerswitcher.renderPanel();
    // buildPopup(map, newWmsLayer, mapView);

    $("#newLayerDialog").modal("hide");
  }

  window.map = map;
}
