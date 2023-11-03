import { Component, OnInit, Directive, ViewContainerRef } from '@angular/core';
import { fromBlob, GeoTIFFImage } from 'geotiff';
import * as L from 'leaflet';
import 'heatmap.js';
import 'leaflet-openweathermap';
import 'leaflet-groupedlayercontrol';
import { XDashService } from 'src/app/services/x-dash.service';
import { Station } from 'src/app/models/station';
import { Tenant } from 'src/app/models/tenant';
import { User } from 'src/app/models/user';
import { Observable, throwError } from 'rxjs';
import * as moment from 'moment';
import * as omnivore from '@mapbox/leaflet-omnivore';
import GeoRasterLayer from 'georaster-layer-for-leaflet';
// import parseGeoRaster from "src/georaster.d";
// import * as fs from "fs";
import * as chroma from 'chroma-js';
import { Buffer } from 'node_modules/buffer';
import { catchError } from 'rxjs/operators';

declare const HeatmapOverlay: any;

@Component({
  selector: 'app-x-dash-map',
  templateUrl: './x-dash-map.component.html',
  styleUrls: ['./x-dash-map.component.css', '../../../bootstrap.css'],
})
export class XDashMapComponent implements OnInit {
  API: string;
  user!: User;
  authKey: string;
  activeTenant: any = {
    id: '1111',
    name: '',
  };
  activeMenuSelected: any;
  tenants!: any[];
  stations!: Station[];
  currentData: any;
  directoryData!: any;
  icon: any;

  options: object = {};
  layersControl: any = {};
  imageUrl: string = '';
  imageBounds: L.LatLngBoundsExpression = [];
  imageOverlay: any;
  layer: any;
  layerRain: any;
  map: any;
  markers: any = {};
  detailedMarkers: any = {};

  loadingData: boolean;

  OWAPI3h: string;
  OWAPICurrent: string;
  OWAPIDaily: string;
  OWKey: string;

  windMap: any;

  fileTypeToBeDL: string;
  fileTypes: any = [
    {
      value: 'none',
      text: 'Select file type',
    },
    {
      value: 'png',
      text: 'PNG',
    },
    {
      value: 'tif',
      text: 'TIFF',
    },
    {
      value: 'csv',
      text: 'CSV',
    },
  ];
  raidus: number = 1;
  legend: any;
  heatmapLayer: any;
  radiusForHeatMap: number = 1;
  arrayList: { lat: any; lng: any; count: any }[] = [];
  stationWithaLat: any;
  toRemove: any;

  streetViewLayer: any;
  satelliteLayer: any;
  windLayer: any;
  tempLayer: any;
  precipitationLayer: any;

  tifFiles: any = [];

  rainColors: any = [];
  minTempColors: any = [];
  maxTempColors: any = [];

  RainfallColorURL: string =
    '../../assets/colorpalette/rainfallobservation.json';
  MaxTempColorURL: string = '../../assets/colorpalette/maxtempobservation.json';
  MinTempColorURL: string = '../../assets/colorpalette/mintempobservation.json';

  disableDonwload: boolean = true;

  setTempLayer(value: any) {
    console.log(value.type);
    if (value.type === 'wind') this.setCurrentWindViewLayer();
    else if (value.type === 'Rainfall') this.setCurrentPrecipitationViewLayer();
    else if (value.type === 'min forecast') this.setCurrentTempViewLayer();
    else if (value.type === 'remove') {
      if (this.map.hasLayer(this.windLayer)) {
        this.map.removeLayer(this.windLayer);
      }

      if (this.map.hasLayer(this.precipitationLayer)) {
        this.map.removeLayer(this.precipitationLayer);
      }

      if (this.map.hasLayer(this.tempLayer)) {
        this.map.removeLayer(this.tempLayer);
      }
    }
  }
  breadCrumbs: any = ['Waiting for action'];
  changecurrentDataBreadCrumbs(e: any) {
    let temp: any = [];
    // this.breadCrumbs = [];
    if (e !== undefined)
      e.forEach((t: any, i: number) => {
        if (t !== '') temp.push(t);
      });
    this.breadCrumbs = temp;
  }
  removeLayers() {
    this.removeLegend();
    this.deleteMarkers();
    this.deleteDetailedMarkers();
    this.deleteImageOverlay();
    this.deleteTIFLayer();
    this.deleteRainTIFLayer();
    // this.createDetailedMarker(this.stations);
    // this.populateDefaultMarker(this.stations);
    this.disableDonwload = true;
    this.fileTypeToBeDL = 'none';
  }
  public createLegendValues(
    highValue: number,
    lowValue: number,
    range: number,
    type: string
  ) {
    let values: any = [];

    let difference = highValue - lowValue;

    let increment: any = 0;
    if (type === 'rain') {
      let baseNo = lowValue;
      increment = range / 5;

      this.rainColors.forEach((data: any, i: number) => {
        if (i === 0) {
          data.value = baseNo;
          baseNo = baseNo + increment;

          let tempValue = data.value.toFixed(2);
          values.push(parseFloat(tempValue));
        } else {
          data.value = baseNo;
          baseNo = baseNo + increment;

          let tempValue = data.value.toFixed(2);
          values.push(parseFloat(tempValue));
        }
      });
      this.createLegend(this.rainColors, 'mm');
    }

    if (type === 'mintemp') {
      let baseNo = lowValue;
      increment = range / 4;

      this.minTempColors.forEach((data: any, i: number) => {
        if (i === 0) {
          data.value = baseNo;
          baseNo = baseNo + increment;

          let tempValue = data.value.toFixed(2);
          values.push(parseFloat(tempValue));
        } else {
          data.value = baseNo;
          baseNo = baseNo + increment;

          let tempValue = data.value.toFixed(2);
          values.push(parseFloat(tempValue));
        }
      });

      this.createLegend(this.minTempColors, '°C');
    }

    if (type === 'maxtemp') {
      let baseNo = lowValue;
      increment = range / 4;

      this.maxTempColors.forEach((data: any, i: number) => {
        if (i === 0) {
          data.value = baseNo;
          baseNo = baseNo + increment;

          let tempValue = data.value.toFixed(2);
          values.push(parseFloat(tempValue));
        } else {
          data.value = baseNo;
          baseNo = baseNo + increment;

          let tempValue = data.value.toFixed(2);
          values.push(parseFloat(tempValue));
        }
      });

      this.createLegend(this.maxTempColors, '°C');
    }
    return values;
    // return legend
  }
  getGradient: object = {};
  private isMapHeatFinsih() {}

  private createLegend(r: any, unit: string) {
    let toView = this.currentData === undefined ? '|' : this.currentData.type;
    let color = toView === 'Rainfall' ? 'black' : 'black';
    if (this.legend !== undefined) this.map.removeControl(this.legend);
    this.legend = L.control.attribution({ position: 'bottomleft' });
    this.legend.onAdd = function (map: any) {
      var div = L.DomUtil.create('div', 'info-legend');
      let labels = [`<strong>${unit}</strong>`];
      div.innerHTML = '';
      for (var i = 0; i < r.length; i++) {
        let value: any = r[i];

        div.innerHTML += labels.push(
          `<div style="background:${
            value.color
          };height:20px;width:80px;color:${color} ;border-bottom: 1px solid black;"><strong style="font-size: 10px;">${
            i === 0 ? '< ' : ''
          }${
            i !== 0 ? parseFloat(r[i - 1].value).toFixed(2) + ' - ' : ''
          }${value.value.toFixed(2)}</strong></div>`
        );
      }

      div.innerHTML = labels.join('');

      return div;
    };
    this.toRemove = this.legend.addTo(this.map);
  }
  private removeLegend() {
    if (this.legend !== undefined) this.map.removeControl(this.legend);
  }
  // private updateHeatMap() {
  //   this.heatMapGradient();
  //   this.arrayList = [];
  //   this.stationWithaLat = this.stations.filter(
  //     (x) => x.latitude !== 0 && x.longitude !== 0
  //   );
  //   let heatLayerConfig = {
  //     container: document.getElementById('map'),
  //     radius: 1,
  //     maxOpacity: 1,
  //     scaleRadius: true,
  //     // property below is responsible for colorization of heat layer
  //     useLocalExtrema: false,
  //     // here we need to assign property value which represent lat in our data
  //     // onExtremaChange: (data: any) => {
  //     //   console.log(data);
  //     // },
  //     latField: 'lat',
  //     // here we need to assign property value which represent lng in our data
  //     lngField: 'lng',
  //     // here we need to assign property value which represent valueField in our data
  //     valueField: 'count',
  //     opacity: 0.75,
  //     minOpacity: 1,
  //     gradient: this.getGradient,
  //     blur: 0.4,
  //   };

  //   this.heatmapLayer._heatmap._renderer.updateConfig(heatLayerConfig);
  //   this.heatmapLayer.setData({ max: 0, data: [] });
  // }
  // private changeHeatMapConfig(cfg: { z: any }) {
  //   let r =
  //     cfg.z > 11
  //       ? 0.05
  //       : cfg.z > 6
  //       ? 1 - (cfg.z * 0.01 - 0.05) - 0.08 * cfg.z
  //       : 1;
  //   let blur = cfg.z > 11 ? 0.18 : 0.65;
  //   let heatLayerConfig = {
  //     container: document.getElementById('map'),
  //     radius: r,
  //     maxOpacity: 1,
  //     scaleRadius: true,
  //     // property below is responsible for colorization of heat layer
  //     useLocalExtrema: false,
  //     // here we need to assign property value which represent lat in our data
  //     // onExtremaChange: (data: any) => {
  //     //   console.log(data);
  //     // },
  //     latField: 'lat',
  //     // here we need to assign property value which represent lng in our data
  //     lngField: 'lng',
  //     // here we need to assign property value which represent valueField in our data
  //     valueField: 'count',
  //     opacity: 0.75,
  //     minOpacity: 0.7,
  //     gradient: this.getGradient,
  //     blur: blur,
  //   };
  //   this.heatmapLayer.cfg = heatLayerConfig;
  //   this.heatmapLayer._heatmap._renderer.updateConfig(heatLayerConfig);
  //   this.heatmapLayer._update();
  // }
  private initMap(): void {
    this.map = L.map('map', {
      zoom: 5,
      minZoom: 2,
      maxZoom: 18,
      center: L.latLng(-29.701776, 115.622528),
      layers: [
        // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }),
        L.tileLayer(
          'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 18, attribution: '...' }
        ),
      ],
    });

    this.satelliteLayer = L.tileLayer(
      'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18, attribution: '...' }
    );
    this.streetViewLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { maxZoom: 18, attribution: '...' }
    );

    this.icon = {
      icon: L.icon({
        iconUrl: '../../../assets/marker-icon.png',
        // iconSize: [25, 41],
        iconAnchor: [12.5, 41],
        popupAnchor: [0, -25],
      }),
    };

    this.imageUrl = '';
    this.imageBounds = [];
    this.imageOverlay = L.imageOverlay('', this.imageBounds, {
      opacity: 0.7,
      interactive: true,
    });

    this.layer = {};
    this.layerRain = {};

    // weather maps
    this.windLayer = L.OWM.wind({
      opacity: 0.7,
      appId: '6802e7b4dff5987ab2d87deb6cb0e00d',
    });

    this.tempLayer = L.OWM.temperature({
      opacity: 0.7,
      appId: '6802e7b4dff5987ab2d87deb6cb0e00d',
    });

    this.precipitationLayer = L.OWM.rain({
      opacity: 0.7,
      showLegend: true,
      appId: '6802e7b4dff5987ab2d87deb6cb0e00d',
    });

    this.layersControl = {
      'Open Street Map': L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 18, attribution: '...' }
      ),
      'Open Satellite Map': L.tileLayer(
        'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18, attribution: '...' }
      ),
    };

    var groupedOverlays: any = {
      WeatherMaps: {
        Wind: this.windLayer,
        Temp: this.tempLayer,
        Precipitation: this.precipitationLayer,
      },
    };

    // L.control
    //   .groupedLayers(this.layersControl, groupedOverlays, {})
    //   .addTo(this.map);
    // L.control.layers(this.layersControl).addTo(this.map);

    const customLayer = L.geoJson([], {
      style: function (feature: any) {
        return {
          color: '#ffffff',
          fillColor: 'none',
        };
      },
    });

    omnivore
      .kml('../../../assets/kmlfiles/BradFarmBoundary1.kml', {}, customLayer)
      .addTo(this.map);
    omnivore
      .kml('../../../assets/kmlfiles/BradFarmBoundary2.kml', {}, customLayer)
      .addTo(this.map);
    omnivore
      .kml('../../../assets/kmlfiles/AlcheringaBoundary.kml', {}, customLayer)
      .addTo(this.map);
    omnivore
      .kml('../../../assets/kmlfiles/AmarinyaOutline.kml', {}, customLayer)
      .addTo(this.map);
    omnivore
      .kml('../../../assets/kmlfiles/ArawaFarmOutline.kml', {}, customLayer)
      .addTo(this.map);
    omnivore
      .kml('../../../assets/kmlfiles/BindanaOutline.kml', {}, customLayer)
      .addTo(this.map);
    omnivore
      .kml('../../../assets/kmlfiles/TantanoolaPaddocks.kml', {}, customLayer)
      .addTo(this.map);
    omnivore
      .kml('../../../assets/kmlfiles/YupiriBoundaries.kml', {}, customLayer)
      .addTo(this.map);

    // this.createHeatMap();
    // this.map.on('zoom', (z: any) => {
    //   let cord = {
    //     z: z.target._zoom,
    //   };

    //   // this.changeHeatMapConfig(cord);
    // });
    // this.addToHeatmap({ lat: -29.701776, lng: 115.622528, count: 0.4 });
  }

  constructor(
    private xDashService: XDashService,
    public viewContainerRef: ViewContainerRef
  ) {
    this.user = {
      access_token: '',
      first_name: '',
      last_name: '',
      tenants: [],
    };

    this.authKey = '';
    this.API = 'https://api.origo.farm/api/v1/';
    this.OWAPI3h = 'https://api.openweathermap.org/data/2.5/forecast';
    this.OWAPICurrent = 'https://api.openweathermap.org/data/2.5/weather';
    this.OWAPIDaily = 'https://api.openweathermap.org/data/2.5/forecast/daily';
    this.OWKey = '6802e7b4dff5987ab2d87deb6cb0e00d';
    this.fileTypeToBeDL = 'none';

    this.loadingData = false;
  }

  ngOnInit() {
    this.loadingData = true;
    this.initMap();
    this.loginUser().subscribe((data: any) => {
      this.authKey = data.access_token;
      // this.getDistributionMapDirectory({ id: '1112' });
      this.getTenants().subscribe((tenants: any) => {
        this.tenants = tenants.collection;
        this.activeTenant = this.tenants[1];

        this.getStations().subscribe((stations: any) => {
          this.stations = stations.collection.map((data: any) => {
            data.value = '';

            return data;
          });

          this.deleteImageOverlay();
          this.deleteMarkers();
          // this.createDetailedMarker(stations.collection);
          this.populateDefaultMarker(stations.collection);
          //
        });
      });
    });

    this.xDashService
      .getRainFallColorPalette(this.RainfallColorURL)
      .subscribe((res) => {
        this.rainColors = res;
      });
    this.xDashService
      .getRainFallColorPalette(this.MaxTempColorURL)
      .subscribe((res) => {
        this.maxTempColors = res;
      });
    this.xDashService
      .getRainFallColorPalette(this.MinTempColorURL)
      .subscribe((res) => {
        this.minTempColors = res;
      });
  }

  public populateDefaultMarker(stations: any) {
    let startDate = moment()
      .subtract(1, 'hours')
      .format('YYYY-MM-DDTHH:mm:ssZ');
    let endDate = moment().format('YYYY-MM-DDTHH:mm:ssZ');
    let len = stations.length;
    let d: any = [];
    this.markers = L.layerGroup().addTo(this.map);
    stations.forEach((station: any, index: number) => {
      if (station.latitude != 0 && station.longitude != 0) {
        d.push([station.latitude, station.longitude]);
        this.getStationMeasurement(station, startDate, endDate).subscribe(
          (measurement: any) => {
            if (measurement.collection) {
              station.measurementAirDelta = measurement.collection[0][
                'Air Delta T (2m)'
              ]
                ? measurement.collection[0]['Air Delta T (2m)']
                : [];
              station.measurementsAirHumidity = measurement.collection[0][
                'Air Humidity (2m)'
              ]
                ? measurement.collection[0]['Air Humidity (2m)']
                : [];
              station.measurementsAirTemperature = measurement.collection[0][
                'Air Temperature (2m)'
              ]
                ? measurement.collection[0]['Air Temperature (2m)']
                : [];
              station.measurementsAirWindDir = measurement.collection[0][
                'Air Wind Direction (6m)'
              ]
                ? measurement.collection[0]['Air Wind Direction (6m)']
                : [];
              station.measurementsAirWindGust = measurement.collection[0][
                'Air Wind Gust (Gust)'
              ]
                ? measurement.collection[0]['Air Wind Gust (Gust)']
                : [];
              station.measurementsAirWindSpeed = measurement.collection[0][
                'Air Wind Speed (Avg)'
              ]
                ? measurement.collection[0]['Air Wind Speed (Avg)']
                : [];
              station.measurementsInternalBatBox = measurement.collection[0][
                'Internal Battery (box)'
              ]
                ? measurement.collection[0]['Internal Battery (box)']
                : [];
              station.measurementsInternalTemp = measurement.collection[0][
                'Internal Temperature (box)'
              ]
                ? measurement.collection[0]['Internal Temperature (box)']
                : [];
              station.measurementsRainfall = measurement.collection[0][
                'Rainfall (0m)'
              ]
                ? measurement.collection[0]['Rainfall (0m)']
                : [];
            }

            this.getStation3hForeCast(
              station.latitude,
              station.longitude
            ).subscribe((forecast: any) => {
              this.getStationCurrentForeCast(
                String(station.latitude),
                String(station.longitude)
              ).subscribe((forecastCurrent: any) => {
                this.getStationDailyForeCast(
                  String(station.latitude),
                  String(station.longitude)
                ).subscribe((forecastDaily: any) => {
                  let content = `
                      <h4>Weather Station Details</h4>
                      Station Name: ${station.stationName}<br>
                      Station Code: ${station.stationCode}<br>
                      Status: ${station.status}<br>
                      Latitude: ${station.latitude}<br>
                      Longitude: ${station.longitude}<br>
                      <a href="https://cloud.origo.ag/#!/station?id=${
                        station.stationCode
                      }&type=weather%20stations">Go to station page</a><br><br>
                      <h6>Measurements 
                        <span>
                          ${
                            station.measurementAirDelta.length > 0
                              ? moment(
                                  station.measurementAirDelta[0][0]
                                ).format('MMMM DD YYYY hh:mm A')
                              : ''
                          }
                        </span>
                      </h6>
                      </b></h6>
                      <table class="table table-sm table-bordered">
                        <thead>
                          <th>Type</th>
                          <th style="width: 25%;">Value</th>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Air Delta (2m)</td>
                            <td>${
                              station.measurementAirDelta &&
                              station.measurementAirDelta.length > 0
                                ? station.measurementAirDelta[0][1]
                                : 0
                            } °C</td>
                          </tr>
                          <tr>
                            <td>Air Humidity (2m)</td>
                            <td>${
                              station.measurementsAirHumidity &&
                              station.measurementsAirHumidity.length > 0
                                ? station.measurementsAirHumidity[0][1]
                                : 0
                            } %</td>
                          </tr>
                          <tr>
                            <td>Air Temperature (2m)</td>
                            <td>${
                              station.measurementsAirTemperature &&
                              station.measurementsAirTemperature.length > 0
                                ? station.measurementsAirTemperature[0][1]
                                : 0
                            } °C</td>
                          </tr>
                          <tr>
                            <td>Air Wind Direction (6m)</td>
                            <td>
                              <div class="row">
                                <div class="col-md-12 col-xs-12">
                                    ${
                                      station.measurementsAirWindDir &&
                                      station.measurementsAirWindDir.length > 0
                                        ? station.measurementsAirWindDir[0][1]
                                        : ''
                                    } °
                                </div>
                                <div class="col-md-3 col-xs-3 pr-0">
                                  ${
                                    station.measurementsAirWindDir &&
                                    station.measurementsAirWindDir.length > 0
                                      ? this.createWindDirection(
                                          station.measurementsAirWindDir[0][1]
                                        )
                                      : ''
                                  }
                                  
                                </div>
                                <div class="col-md-9 col-xs-9 pl-0">
                                  <span>
                                    ${this.windDirectionText(
                                      station.measurementsAirWindDir &&
                                        station.measurementsAirWindDir.length >
                                          0
                                        ? station.measurementsAirWindDir[0][1]
                                        : ''
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>Air Wind Gust (Gust)</td>
                            <td>${
                              station.measurementsAirWindGust &&
                              station.measurementsAirWindGust.length > 0
                                ? station.measurementsAirWindGust[0][1]
                                : 0
                            } km/h</td>
                          </tr>
                          <tr>
                            <td>Air Wind Speed (Avg)</td>
                            <td>${
                              station.measurementsAirWindSpeed &&
                              station.measurementsAirWindSpeed.length > 0
                                ? station.measurementsAirWindSpeed[0][1]
                                : 0
                            } km/h</td>
                          </tr>
                          <tr>
                            <td>Rainfall (0m)</td>
                            <td>${
                              station.measurementsRainfall &&
                              station.measurementsRainfall.length > 0
                                ? station.measurementsRainfall[0][1]
                                : 0
                            } mm</td>
                          </tr>
                        </tbody>
                      </table>
                      <h4>Forecast</h4>
                      <ul class="nav nav-tabs" id="myTab" role="tablist">
                        <li class="nav-item" role="presentation">
                          <button class="nav-link active" id="current-tab" data-bs-toggle="tab" data-bs-target="#current" type="button" role="tab" aria-controls="current" aria-selected="true">Current Forecast</button>
                        </li>
                        <li class="nav-item" role="presentation">
                          <button class="nav-link" id="three-hour-tab" data-bs-toggle="tab" data-bs-target="#three-hour" type="button" role="tab" aria-controls="three-hour" aria-selected="false">3h Forecast</button>
                        </li>
                        <li class="nav-item" role="presentation">
                          <button class="nav-link" id="daily-tab" data-bs-toggle="tab" data-bs-target="#daily" type="button" role="tab" aria-controls="daily" aria-selected="false">Daily Forecast</button>
                        </li>
                      </ul>
                      <div class="tab-content" id="myTabContent">
                        <div class="tab-pane fade show active" id="current" role="tabpanel" aria-labelledby="current-tab">
                            ${this.createCurrentForecastTable(forecastCurrent)}
                        </div>
                        <div class="tab-pane fade" id="three-hour" role="tabpanel" aria-labelledby="three-hour-tab">
                          <h5>
                            ${forecast.city.name}, ${forecast.city.country} 
                          </h5>
                          ${this.create3hForecastTable(forecast)}
                        </div>
                        <div class="tab-pane fade" id="daily" role="tabpanel" aria-labelledby="daily-tab">
                          <h5>
                            ${forecastDaily.city.name}, ${
                    forecast.city.country
                  } 
                          </h5>
                          ${this.createDailyForecastTable(forecastDaily)}
                        </div>
                      </div>
                    `;

                  this.createDetailedMarker(station, content);

                  if (len === index + 1) {
                    this.map.fitBounds(d);
                    this.loadingData = false;
                  }
                });
              });
            });
          }
        );
      }
    });
  }

  public deleteMarkers() {
    if (this.map.hasLayer(this.markers)) {
      this.map.removeLayer(this.markers); // remove
    }
  }

  public deleteDetailedMarkers() {
    if (this.map.hasLayer(this.detailedMarkers)) {
      this.map.removeLayer(this.detailedMarkers); // remove
    }
  }

  public deleteImageOverlay() {
    if (this.map.hasLayer(this.imageOverlay)) {
      this.map.removeLayer(this.imageOverlay);
    }
  }

  public deleteTIFLayer() {
    if (this.map.hasLayer(this.layer)) {
      this.map.removeLayer(this.layer);
    }
  }

  public deleteRainTIFLayer() {
    if (this.map.hasLayer(this.layerRain)) {
      this.map.removeLayer(this.layerRain);
    }
  }

  public setSatelliteLayer() {
    this.map.removeLayer(this.streetViewLayer);

    this.satelliteLayer.addTo(this.map);

    if (this.map.hasLayer(this.layer)) {
      let layer = this.layer;
      this.deleteTIFLayer();
      layer.addTo(this.map);
      this.map.fitBounds(layer.getBounds());
    }

    if (this.map.hasLayer(this.layerRain)) {
      let layerRain = this.layerRain;
      this.deleteRainTIFLayer();
      layerRain.addTo(this.map);
      this.map.fitBounds(layerRain.getBounds());
    }

    if (this.map.hasLayer(this.windLayer)) {
      let windLayer = this.windLayer;
      this.map.removeLayer(this.windLayer);
      windLayer.addTo(this.map);
    }

    if (this.map.hasLayer(this.tempLayer)) {
      let tempLayer = this.tempLayer;
      this.map.removeLayer(this.tempLayer);
      tempLayer.addTo(this.map);
    }

    if (this.map.hasLayer(this.precipitationLayer)) {
      let precipitationLayer = this.precipitationLayer;
      this.map.removeLayer(this.precipitationLayer);
      precipitationLayer.addTo(this.map);
    }
  }

  public setStreetViewLayer() {
    this.map.removeLayer(this.satelliteLayer);

    this.streetViewLayer.addTo(this.map);

    if (this.map.hasLayer(this.layer)) {
      let layer = this.layer;
      this.deleteTIFLayer();
      layer.addTo(this.map);
      this.map.fitBounds(layer.getBounds());
    }

    if (this.map.hasLayer(this.layerRain)) {
      let layerRain = this.layerRain;
      this.deleteRainTIFLayer();
      layerRain.addTo(this.map);
      this.map.fitBounds(layerRain.getBounds());
    }

    if (this.map.hasLayer(this.windLayer)) {
      let windLayer = this.windLayer;
      this.map.removeLayer(this.windLayer);
      windLayer.addTo(this.map);
    }

    if (this.map.hasLayer(this.tempLayer)) {
      let tempLayer = this.tempLayer;
      this.map.removeLayer(this.tempLayer);
      tempLayer.addTo(this.map);
    }

    if (this.map.hasLayer(this.precipitationLayer)) {
      let precipitationLayer = this.precipitationLayer;
      this.map.removeLayer(this.precipitationLayer);
      precipitationLayer.addTo(this.map);
    }
  }

  public setCurrentWindViewLayer() {
    if (this.map.hasLayer(this.windLayer)) {
      this.map.removeLayer(this.windLayer);
    } else {
      this.windLayer.addTo(this.map);
    }
  }

  public setCurrentTempViewLayer() {
    if (this.map.hasLayer(this.tempLayer)) {
      this.map.removeLayer(this.tempLayer);
    } else {
      this.tempLayer.addTo(this.map);
    }
  }

  public setCurrentPrecipitationViewLayer() {
    if (this.map.hasLayer(this.precipitationLayer)) {
      this.map.removeLayer(this.precipitationLayer);
    } else {
      this.precipitationLayer.addTo(this.map);
    }
  }

  public setCalibratedRainfall5Min() {
    let currentDateTime = moment().valueOf();
    console.log(currentDateTime);
    // this.getAccumulationRainPrecipitation( 'IDR310A1', '1697456580000', '1697456732000' )
  }

  removeGetAccumulationRainPrecipitation() {
    // this.map.removeLayer(this.layerRain);
    // this.removeLegend();
  }

  public getAccumulationRainPrecipitation(e: any) {
    this.deleteRainTIFLayer();
    // this.loadingData = true;

    let api = 'http://54.252.231.44:4200/api/getAccumulationRainPrecipitation';
    this.xDashService
      .getAccumulationRainPrecipitation(api, e.timeOfKind)
      .subscribe((file: any) => {
        this.tifFiles = file;

        if (this.tifFiles.length === 0) {
          // this.loadingData = false;
        } else {
          const parseGeoraster = require('georaster');

          this.tifFiles.forEach((file: any, index: number) => {
            let tifFile = this.dataURItoBlob(file.fileDir);
            parseGeoraster(tifFile).then((georaster: any) => {
              console.log('georaster:', georaster);

              console.log(index);
              if (!isNaN(georaster.ranges[0])) {
                let min = georaster.mins[0];
                let max = georaster.maxs[0];
                let range = georaster.ranges[0];
                let values = [
                  0.29, 4.85, 9.99, 10, 17.45, 24.99, 25, 37.45, 49.99, 50,
                  74.95, 99.99, 100, 175.5, 250,
                ];
                let scale = chroma
                  .scale([
                    '#7FFEFF',
                    '#7FE4FF',
                    '#7FCBFF',
                    '#7FB2FF',
                    '#7F9DFF',
                    '#7F7FCC',
                    '#7FFF99',
                    '#7FE57F',
                    '#7FCE7F',
                    '#FFE47F',
                    '#FFCB7F',
                    '#FFB27F',
                    '#FF7F7F',
                    '#E57F7F',
                    '#CC7F7F',
                    '#FF4040',
                  ])
                  .classes(values);
                let legendValues = [
                  {
                    value: 0.29,
                    color: '#7FFEFF',
                  },
                  {
                    value: 4.85,
                    color: '#7FE4FF',
                  },
                  {
                    value: 9.99,
                    color: '#7FCBFF',
                  },
                  {
                    value: 10,
                    color: '#7FB2FF',
                  },
                  {
                    value: 17.45,
                    color: '#7F9DFF',
                  },
                  {
                    value: 24.99,
                    color: '#7F7FCC',
                  },
                  {
                    value: 25,
                    color: '#7FFF99',
                  },
                  {
                    value: 37.45,
                    color: '#7FE57F',
                  },
                  {
                    value: 49.99,
                    color: '#7FCE7F',
                  },
                  {
                    value: 50,
                    color: '#FFE47F',
                  },
                  {
                    value: 74.95,
                    color: '#FFCB7F',
                  },
                  {
                    value: 99.99,
                    color: '#FFB27F',
                  },
                  {
                    value: 100,
                    color: '#FF7F7F',
                  },
                  {
                    value: 175.5,
                    color: '#E57F7F',
                  },
                  {
                    value: 250,
                    color: '#CC7F7F',
                  },
                  {
                    value: 500,
                    color: '#FF4040',
                  },
                ];

                this.createLegend(legendValues, 'mm');

                let nortEast = L.latLng(georaster.ymax, georaster.xmax);
                let southWest = L.latLng(georaster.ymin, georaster.xmin);
                let bounds = L.latLngBounds(nortEast, southWest);

                this.layerRain = new GeoRasterLayer({
                  georaster: georaster,
                  opacity: 0.7,
                  resolution: 256,
                  pixelValuesToColorFn: function (pixelValues) {
                    var pixelValue = pixelValues[0]; // there's just one band in this raster

                    // if there's zero wind, don't return a color
                    if (pixelValue === 0) return null;

                    // scale to 0 - 1 used by chroma
                    // var scaledPixelValue = (pixelValue - min) / range;

                    var color: any = '';

                    if (pixelValue <= values[0]) {
                      color = scale(pixelValue).hex();
                    }
                    if (pixelValue <= values[1] && pixelValue > values[0]) {
                      color = scale(pixelValue).hex();
                    }
                    if (pixelValue <= values[2] && pixelValue > values[1]) {
                      color = scale(pixelValue).hex();
                    }
                    if (pixelValue <= values[3] && pixelValue > values[2]) {
                      color = scale(pixelValue).hex();
                    }
                    if (pixelValue <= values[4] && pixelValue > values[3]) {
                      color = scale(pixelValue).hex();
                    }
                    if (pixelValue <= values[5] && pixelValue > values[4]) {
                      color = scale(pixelValue).hex();
                    }
                    if (pixelValue <= values[6] && pixelValue > values[5]) {
                      color = scale(pixelValue).hex();
                    }
                    if (pixelValue <= values[7] && pixelValue > values[6]) {
                      color = scale(pixelValue).hex();
                    }
                    if (pixelValue <= values[8] && pixelValue > values[7]) {
                      color = scale(pixelValue).hex();
                    }
                    if (pixelValue <= values[9] && pixelValue > values[8]) {
                      color = scale(pixelValue).hex();
                    }
                    if (pixelValue <= values[10] && pixelValue > values[9]) {
                      color = scale(pixelValue).hex();
                    }
                    if (pixelValue <= values[11] && pixelValue > values[10]) {
                      color = scale(pixelValue).hex();
                    }
                    if (pixelValue <= values[12] && pixelValue > values[11]) {
                      color = scale(pixelValue).hex();
                    }
                    if (pixelValue <= values[13] && pixelValue > values[12]) {
                      color = scale(pixelValue).hex();
                    }
                    if (pixelValue < values[14]) {
                      color = scale(pixelValue).hex();
                    }

                    return color;
                  },
                });

                this.layerRain.addTo(this.map);
                this.map.fitBounds(this.layerRain.getBounds());
                // this.loadingData = false;
              }
            });
          });
        }
      });
  }

  public createMarker(
    station: any,
    startDate: string,
    endDate: string,
    groupByTime: string,
    type: string,
    group: string,
    content: any
  ) {
    L.marker([station.latitude, station.longitude], {
      icon: L.icon({
        iconUrl: '../../../assets/marker-icon.png',
        // iconSize: [30, 30],
        iconAnchor: [12.5, 41],
      }),
    })
      .addTo(this.markers)
      .bindPopup(content, {
        maxHeight: 500,
        minWidth: 500,
      });
  }

  public createMarkerNew(
    station: any,
    startDate: string,
    endDate: string,
    groupByTime: string,
    type: string,
    group: string,
    content: any
  ) {
    L.marker([station.latitude, station.longitude], {
      icon: L.icon({
        iconUrl: '../../../assets/marker-icon.png',
        // iconSize: [30, 30],
        iconAnchor: [12.5, 41],
      }),
    })
      .addTo(this.markers)
      .on('click', (e: any) => {
        this.populateMarkerDetailsNew(e, station, content);
      })
      .bindPopup(``, {
        maxHeight: 500,
        minWidth: 500,
      });
  }

  // public createDetailedMarker(stations: any) {
  //   // return false
  //   let d = [];
  //   this.markers = L.layerGroup().addTo(this.map);
  //   for (let station of stations) {
  //     if (station.latitude !== 0 && station.longitude !== 0)
  //       d.push([station.latitude, station.longitude]);
  //     L.marker([station.latitude, station.longitude], {
  //       icon: L.icon({
  //         iconUrl: '../../../assets/marker-icon.png',
  //         // iconSize: [30, 30],
  //         iconAnchor: [15, 30],
  //       }),
  //     })
  //       .addTo(this.markers)
  //       .on('click', (e: any) => {
  //         this.populateMarkerDetails(e, station);
  //       })
  //       .bindPopup(``, {
  //         maxHeight: 500,
  //         minWidth: 500,
  //       });
  //   }

  //   // this.map.flyToBounds(d, { duration: 3 });
  //   this.map.fitBounds(d);
  //   this.loadingData = false;
  // }

  public createDetailedMarker(station: any, content: any) {
    L.marker([station.latitude, station.longitude], {
      icon: L.icon({
        iconUrl: '../../../assets/marker-icon.png',
        iconAnchor: [12.5, 41],
      }),
    })
      .addTo(this.markers)
      .bindPopup(content, {
        maxHeight: 500,
        minWidth: 500,
      });
  }

  public getDirection(degrees: any) {
    var directions = [
      'North',
      'North-East',
      'East',
      'South-East',
      'South',
      'South-West',
      'West',
      'North-West',
    ];
    var index =
      Math.round(((degrees %= 360) < 0 ? degrees + 360 : degrees) / 45) % 8;
    return directions[index];
  }

  public createWindDirection(degrees: any) {
    if (degrees === null || !degrees) {
      return '';
    }

    let content = `
      <span class="bi bi-arrow-down" style="transform:rotate(${degrees}deg);font-size:15px; display: block; font-size: 14px; width: 15px;">
      </span>
    `;

    return content;
  }

  public windDirectionText(degrees: any) {
    if (degrees === null || !degrees) {
      return '';
    }
    // Insert the amount of degrees here

    let finalDegree = 0;
    if (degrees <= 180) {
      finalDegree = parseFloat(degrees) + 180;
    }
    if (degrees > 180) {
      finalDegree = parseFloat(degrees) - 180;
    }

    // Define array of directions
    let directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

    // Split into the 8 directions
    finalDegree = (finalDegree * 8) / 360;

    // round to nearest integer.
    finalDegree = Math.round(finalDegree);

    // Ensure it's within 0-7
    finalDegree = (finalDegree + 8) % 8;
    return directions[finalDegree];
  }

  public populateMarkerDetails(e: any, station: any) {
    var popup = e.target.getPopup();
    let startDate = moment()
      .subtract(1, 'hours')
      .format('YYYY-MM-DDTHH:mm:ssZ');
    let endDate = moment().format('YYYY-MM-DDTHH:mm:ssZ');

    this.getStationMeasurement(station, startDate, endDate).subscribe(
      (measurement: any) => {
        if (measurement.collection) {
          station.measurementAirDelta = measurement.collection[0][
            'Air Delta T (2m)'
          ]
            ? measurement.collection[0]['Air Delta T (2m)']
            : [];
          station.measurementsAirHumidity = measurement.collection[0][
            'Air Humidity (2m)'
          ]
            ? measurement.collection[0]['Air Humidity (2m)']
            : [];
          station.measurementsAirTemperature = measurement.collection[0][
            'Air Temperature (2m)'
          ]
            ? measurement.collection[0]['Air Temperature (2m)']
            : [];
          station.measurementsAirWindDir = measurement.collection[0][
            'Air Wind Direction (6m)'
          ]
            ? measurement.collection[0]['Air Wind Direction (6m)']
            : [];
          station.measurementsAirWindGust = measurement.collection[0][
            'Air Wind Gust (Gust)'
          ]
            ? measurement.collection[0]['Air Wind Gust (Gust)']
            : [];
          station.measurementsAirWindSpeed = measurement.collection[0][
            'Air Wind Speed (Avg)'
          ]
            ? measurement.collection[0]['Air Wind Speed (Avg)']
            : [];
          station.measurementsInternalBatBox = measurement.collection[0][
            'Internal Battery (box)'
          ]
            ? measurement.collection[0]['Internal Battery (box)']
            : [];
          station.measurementsInternalTemp = measurement.collection[0][
            'Internal Temperature (box)'
          ]
            ? measurement.collection[0]['Internal Temperature (box)']
            : [];
          station.measurementsRainfall = measurement.collection[0][
            'Rainfall (0m)'
          ]
            ? measurement.collection[0]['Rainfall (0m)']
            : [];
        }

        this.getStation3hForeCast(
          station.latitude,
          station.longitude
        ).subscribe((forecast: any) => {
          this.getStationCurrentForeCast(
            String(station.latitude),
            String(station.longitude)
          ).subscribe((forecastCurrent: any) => {
            this.getStationDailyForeCast(
              String(station.latitude),
              String(station.longitude)
            ).subscribe((forecastDaily: any) => {
              popup.setContent(`
                  <h4>Weather Station Details</h4>
                  Station Name: ${station.stationName}<br>
                  Station Code: ${station.stationCode}<br>
                  Status: ${station.status}<br>
                  Latitude: ${station.latitude}<br>
                  Longitude: ${station.longitude}<br>
                  <a href="https://cloud.origo.ag/#!/station?id=${
                    station.stationCode
                  }&type=weather%20stations">Go to station page</a><br><br>
                  <h6>Measurements 
                    <span>
                      ${
                        station.measurementAirDelta.length > 0
                          ? moment(station.measurementAirDelta[0][0]).format(
                              'MMMM DD YYYY hh:mm A'
                            )
                          : ''
                      }
                    </span>
                  </h6>
                  </b></h6>
                  <table class="table table-sm table-bordered">
                    <thead>
                      <th>Type</th>
                      <th style="width: 25%;">Value</th>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Air Delta (2m)</td>
                        <td>${
                          station.measurementAirDelta &&
                          station.measurementAirDelta.length > 0
                            ? station.measurementAirDelta[0][1]
                            : 0
                        } °C</td>
                      </tr>
                      <tr>
                        <td>Air Humidity (2m)</td>
                        <td>${
                          station.measurementsAirHumidity &&
                          station.measurementsAirHumidity.length > 0
                            ? station.measurementsAirHumidity[0][1]
                            : 0
                        } %</td>
                      </tr>
                      <tr>
                        <td>Air Temperature (2m)</td>
                        <td>${
                          station.measurementsAirTemperature &&
                          station.measurementsAirTemperature.length > 0
                            ? station.measurementsAirTemperature[0][1]
                            : 0
                        } °C</td>
                      </tr>
                      <tr>
                        <td>Air Wind Direction (6m)</td>
                        <td>
                          <div class="row">
                            <div class="col-md-12 col-xs-12">
                                ${
                                  station.measurementsAirWindDir &&
                                  station.measurementsAirWindDir.length > 0
                                    ? station.measurementsAirWindDir[0][1]
                                    : ''
                                } °
                            </div>
                            <div class="col-md-3 col-xs-3 pr-0">
                              ${
                                station.measurementsAirWindDir &&
                                station.measurementsAirWindDir.length > 0
                                  ? this.createWindDirection(
                                      station.measurementsAirWindDir[0][1]
                                    )
                                  : ''
                              }
                              
                            </div>
                            <div class="col-md-9 col-xs-9 pl-0">
                              <span>
                                ${this.windDirectionText(
                                  station.measurementsAirWindDir &&
                                    station.measurementsAirWindDir.length > 0
                                    ? station.measurementsAirWindDir[0][1]
                                    : ''
                                )}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>Air Wind Gust (Gust)</td>
                        <td>${
                          station.measurementsAirWindGust &&
                          station.measurementsAirWindGust.length > 0
                            ? station.measurementsAirWindGust[0][1]
                            : 0
                        } km/h</td>
                      </tr>
                      <tr>
                        <td>Air Wind Speed (Avg)</td>
                        <td>${
                          station.measurementsAirWindSpeed &&
                          station.measurementsAirWindSpeed.length > 0
                            ? station.measurementsAirWindSpeed[0][1]
                            : 0
                        } km/h</td>
                      </tr>
                      <tr>
                        <td>Rainfall (0m)</td>
                        <td>${
                          station.measurementsRainfall &&
                          station.measurementsRainfall.length > 0
                            ? station.measurementsRainfall[0][1]
                            : 0
                        } mm</td>
                      </tr>
                    </tbody>
                  </table>
                  <h4>Forecast</h4>
                  <ul class="nav nav-tabs" id="myTab" role="tablist">
                    <li class="nav-item" role="presentation">
                      <button class="nav-link active" id="current-tab" data-bs-toggle="tab" data-bs-target="#current" type="button" role="tab" aria-controls="current" aria-selected="true">Current Forecast</button>
                    </li>
                    <li class="nav-item" role="presentation">
                      <button class="nav-link" id="three-hour-tab" data-bs-toggle="tab" data-bs-target="#three-hour" type="button" role="tab" aria-controls="three-hour" aria-selected="false">3h Forecast</button>
                    </li>
                    <li class="nav-item" role="presentation">
                      <button class="nav-link" id="daily-tab" data-bs-toggle="tab" data-bs-target="#daily" type="button" role="tab" aria-controls="daily" aria-selected="false">Daily Forecast</button>
                    </li>
                  </ul>
                  <div class="tab-content" id="myTabContent">
                    <div class="tab-pane fade show active" id="current" role="tabpanel" aria-labelledby="current-tab">
                        ${this.createCurrentForecastTable(forecastCurrent)}
                    </div>
                    <div class="tab-pane fade" id="three-hour" role="tabpanel" aria-labelledby="three-hour-tab">
                      <h5>
                        ${forecast.city.name}, ${forecast.city.country} 
                      </h5>
                      ${this.create3hForecastTable(forecast)}
                    </div>
                    <div class="tab-pane fade" id="daily" role="tabpanel" aria-labelledby="daily-tab">
                      <h5>
                        ${forecastDaily.city.name}, ${forecast.city.country} 
                      </h5>
                      ${this.createDailyForecastTable(forecastDaily)}
                    </div>
                  </div>
                `);
            });
          });
        });
      }
    );
  }

  public populateMarkerDetailsNew(e: any, station: any, content: any) {
    var popup = e.target.getPopup();
    let _content = content;
    let startDate = moment()
      .subtract(1, 'hours')
      .format('YYYY-MM-DDTHH:mm:ssZ');
    let endDate = moment().format('YYYY-MM-DDTHH:mm:ssZ');

    this.getStation3hForeCast(station.latitude, station.longitude).subscribe(
      (forecast: any) => {
        this.getStationCurrentForeCast(
          String(station.latitude),
          String(station.longitude)
        ).subscribe((forecastCurrent: any) => {
          this.getStationDailyForeCast(
            String(station.latitude),
            String(station.longitude)
          ).subscribe((forecastDaily: any) => {
            popup.setContent(`
              ${_content}
              <h4>Forecast</h4>
              <ul class="nav nav-tabs" id="myTab" role="tablist">
                <li class="nav-item" role="presentation">
                  <button class="nav-link active" id="current-tab" data-bs-toggle="tab" data-bs-target="#current" type="button" role="tab" aria-controls="current" aria-selected="true">Current Forecast</button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link" id="three-hour-tab" data-bs-toggle="tab" data-bs-target="#three-hour" type="button" role="tab" aria-controls="three-hour" aria-selected="false">3h Forecast</button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link" id="daily-tab" data-bs-toggle="tab" data-bs-target="#daily" type="button" role="tab" aria-controls="daily" aria-selected="false">Daily Forecast</button>
                </li>
              </ul>
              <div class="tab-content" id="myTabContent">
                <div class="tab-pane fade show active" id="current" role="tabpanel" aria-labelledby="current-tab">
                    ${this.createCurrentForecastTable(forecastCurrent)}
                </div>
                <div class="tab-pane fade" id="three-hour" role="tabpanel" aria-labelledby="three-hour-tab">
                  <h5>
                    ${forecast.city.name}, ${forecast.city.country} 
                  </h5>
                  ${this.create3hForecastTable(forecast)}
                </div>
                <div class="tab-pane fade" id="daily" role="tabpanel" aria-labelledby="daily-tab">
                  <h5>
                    ${forecastDaily.city.name}, ${forecast.city.country} 
                  </h5>
                  ${this.createDailyForecastTable(forecastDaily)}
                </div>
              </div>
            `);
          });
        });
      }
    );
  }

  public populateMarkerSummary(
    e: any,
    station: any,
    startDate: string,
    endDate: string,
    groupByTime: string,
    type: string,
    group: string
  ) {
    var popup = e.target.getPopup();

    this.getStationMeasurementGroupByTime(
      station,
      startDate,
      endDate,
      groupByTime
    ).subscribe((measurement: any) => {
      if (measurement.collection && type === 'Rainfall') {
        station.measurementsRainfall = measurement.collection[0][
          'Rainfall (0m)'
        ].Sum
          ? measurement.collection[0]['Rainfall (0m)'].Sum
          : [];

        if (group === 'monthly') {
          popup.setContent(`
            <h4>Weather Station Details</h4>
            Station Name: ${station.stationName}<br>
            Station Code: ${station.stationCode}<br>
            Status: ${station.status}<br>
            Latitude: ${station.latitude}<br>
            Longitude: ${station.longitude}<br>
            <a href="https://cloud.origo.ag/#!/station?id=${station.stationCode}&type=weather%20stations">Go to station page</a><br><br>
            <h6><b>${type} ${station.measurementsRainfall[1][0]}: ${station.measurementsRainfall[1][1]}</b></h6> 
          `);
        }

        if (group === 'yearly') {
          let total = 0;
          let average = 0;
          let len = station.measurementsRainfall.length;

          station.measurementsRainfall.forEach((value: any) => {
            total = total + parseFloat(value[1]);
          });
          average = total / len;

          popup.setContent(`
            <h4>Weather Station Details</h4>
            Station Name: ${station.stationName}<br>
            Station Code: ${station.stationCode}<br>
            Status: ${station.status}<br>
            Latitude: ${station.latitude}<br>
            Longitude: ${station.longitude}<br>
            <a href="https://cloud.origo.ag/#!/station?id=${
              station.stationCode
            }&type=weather%20stations">Go to station page</a><br><br>
            <h6><b>${type} ${moment(station.measurementsRainfall[0][0]).format(
            'YYYY'
          )} annual summary: ${total.toFixed(2)}</b></h6> 
          `);
        }
      }

      if (measurement.collection && type === 'Max_Temperature') {
        station.measurementsMaxAirTemperature = measurement.collection[0][
          'Air Temperature (2m)'
        ].Max
          ? measurement.collection[0]['Air Temperature (2m)'].Max
          : [];

        if (group === 'monthly') {
          popup.setContent(`
            <h4>Weather Station Details</h4>
            Station Name: ${station.stationName}<br>
            Station Code: ${station.stationCode}<br>
            Status: ${station.status}<br>
            Latitude: ${station.latitude}<br>
            Longitude: ${station.longitude}<br>
            <a href="https://cloud.origo.ag/#!/station?id=${station.stationCode}&type=weather%20stations">Go to station page</a><br><br>
            <h6><b>${type} ${station.measurementsMaxAirTemperature[0][0]}: ${station.measurementsMaxAirTemperature[0][1]}</b></h6> 
          `);
        }
        if (group === 'yearly') {
          let total = 0;
          let average = 0;
          let len = station.measurementsMaxAirTemperature.length;

          station.measurementsMaxAirTemperature.forEach((value: any) => {
            total = total + parseFloat(value[1]);
          });
          average = total / len;

          popup.setContent(`
            <h4>Weather Station Details</h4>
            Station Name: ${station.stationName}<br>
            Station Code: ${station.stationCode}<br>
            Status: ${station.status}<br>
            Latitude: ${station.latitude}<br>
            Longitude: ${station.longitude}<br>
            <a href="https://cloud.origo.ag/#!/station?id=${
              station.stationCode
            }&type=weather%20stations">Go to station page</a><br><br>
            <h6><b>${type} ${moment(
            station.measurementsMaxAirTemperature[0][0]
          ).format('YYYY')} annual summary: ${average.toFixed(2)}</b></h6> 
          `);
        }
      }

      if (measurement.collection && type === 'Min_Temperature') {
        station.measurementsMinAirTemperature = measurement.collection[0][
          'Air Temperature (2m)'
        ].Min
          ? measurement.collection[0]['Air Temperature (2m)'].Min
          : [];

        if (group === 'monthly') {
          popup.setContent(`
            <h4>Weather Station Details</h4>
            Station Name: ${station.stationName}<br>
            Station Code: ${station.stationCode}<br>
            Status: ${station.status}<br>
            Latitude: ${station.latitude}<br>
            Longitude: ${station.longitude}<br>
            <a href="https://cloud.origo.ag/#!/station?id=${station.stationCode}&type=weather%20stations">Go to station page</a><br><br>
            <h6><b>${type} ${station.measurementsMinAirTemperature[0][0]}: ${station.measurementsMinAirTemperature[0][1]}</b></h6> 
          `);
        }

        if (group === 'yearly') {
          let total = 0;
          let average = 0;
          let len = station.measurementsMinAirTemperature.length;

          station.measurementsMinAirTemperature.forEach((value: any) => {
            total = total + parseFloat(value[1]);
          });
          average = total / len;

          popup.setContent(`
            <h4>Weather Station Details</h4>
            Station Name: ${station.stationName}<br>
            Station Code: ${station.stationCode}<br>
            Status: ${station.status}<br>
            Latitude: ${station.latitude}<br>
            Longitude: ${station.longitude}<br>
            <a href="https://cloud.origo.ag/#!/station?id=${
              station.stationCode
            }&type=weather%20stations">Go to station page</a><br><br>
            <h6><b>${type} ${moment(
            station.measurementsMinAirTemperature[0][0]
          ).format('YYYY')} annual summary: ${average.toFixed(2)}</b></h6> 
          `);
        }
      }
    });
  }

  public loginUser(): Observable<any> {
    return this.xDashService.login(this.API, 'eacomm', 'origo');
  }

  public getTenants(): Observable<any> {
    return this.xDashService.getTenants(this.API, this.authKey, 'eacomm');
  }

  public getStations(): Observable<any> {
    return this.xDashService.getStations(
      this.API,
      this.authKey,
      this.activeTenant.id
    );
  }

  public getStationMeasurement(
    data: any,
    startDate: string,
    endDate: string
  ): Observable<any> {
    return this.xDashService.getStationMeasurement(
      this.API,
      this.authKey,
      this.activeTenant.id,
      data.stationCode,
      startDate,
      endDate
    );
  }

  public getStationMeasurementGroupByTime(
    data: any,
    startDate: string,
    endDate: string,
    groupByTime: string
  ): Observable<any> {
    return this.xDashService.getStationMeasurementGroupByTime(
      this.API,
      this.authKey,
      this.activeTenant.id,
      data.stationCode,
      startDate,
      endDate,
      groupByTime
    );
  }

  public getStation3hForeCast(lat: string, lon: string): Observable<any> {
    return this.xDashService.getStation3hForeCast(
      this.OWAPI3h,
      this.OWKey,
      lat,
      lon
    );
  }

  public getStationCurrentForeCast(lat: string, lon: string) {
    return this.xDashService.getStationCurrentForeCast(
      this.OWAPICurrent,
      this.OWKey,
      lat,
      lon
    );
  }

  public getStationDailyForeCast(lat: string, lon: string): Observable<any> {
    return this.xDashService.getStationDailyForeCast(
      this.OWAPIDaily,
      this.OWKey,
      lat,
      lon
    );
  }

  public async getDistributionMapDirectory(tenant: any) {
    // this.updateHeatMap();
    this.removeLegend();
    this.loadingData = true;
    this.xDashService
      .getDistributionMapDirectory(this.API, this.authKey, tenant.id)
      .subscribe((data: any) => {
        this.updateTenant(tenant);
        this.directoryData = data;
        this.loadingData = false;
      });
  }

  public updateTenant(details: any) {
    this.loadingData = true;

    this.loginUser().subscribe((data: any) => {
      this.authKey = data.access_token;

      this.activeTenant = this.tenants.find((tenant: Tenant) => {
        return tenant.id === details.id;
      });

      this.getStations().subscribe((stations: any) => {
        this.stations = stations.collection;
        // this.map.flyTo([-26.031404, 134.096183], 5);
        this.deleteImageOverlay();
        this.deleteMarkers();
        this.deleteTIFLayer();
        this.deleteDetailedMarkers();

        // this.createDetailedMarker(stations.collection);
        this.populateDefaultMarker(stations.collection);
      });
    });
  }

  private async convertBase64ToBlob(base64Image: string) {
    // Split into two parts
    const parts = base64Image.split(';base64,');

    // Hold the content type
    const imageType = parts[0].split(':')[1];

    // Decode Base64 string
    const decodedData = window.atob(parts[1]);

    // Create UNIT8ARRAY of size same as row data length
    const uInt8Array = new Uint8Array(decodedData.length);

    // Insert all character code into uInt8Array
    for (let i = 0; i < decodedData.length; ++i) {
      uInt8Array[i] = decodedData.charCodeAt(i);
    }

    // Return BLOB image after conversion
    return new Blob([uInt8Array], { type: imageType });
  }

  public async downloadDistributionMapFile(event: any) {
    this.xDashService
      .getDistributionMapFile(
        this.API,
        this.authKey,
        this.activeTenant.id,
        this.currentData.type,
        this.currentData.year,
        this.currentData.fileName,
        this.fileTypeToBeDL
      )
      .subscribe(async (file: any) => {
        if (this.fileTypeToBeDL === 'csv') {
          const blob = await this.convertBase64ToBlob(file);
          const blobUrl = URL.createObjectURL(blob);

          // create <a> tag dinamically
          var fileLink = document.createElement('a');
          fileLink.href = blobUrl;

          // it forces the name of the downloaded file
          fileLink.download = `${this.currentData.fileName}_${this.currentData.year}`;

          // triggers the click event
          fileLink.click();
        }
        if (this.fileTypeToBeDL === 'png') {
          const blob = await this.convertBase64ToBlob(file);
          const blobUrl = URL.createObjectURL(blob);

          // create <a> tag dinamically
          var fileLink = document.createElement('a');
          fileLink.href = blobUrl;

          // it forces the name of the downloaded file
          fileLink.download = `${this.currentData.fileName}_${this.currentData.year}`;

          // triggers the click event
          fileLink.click();
        }
        if (this.fileTypeToBeDL === 'tif') {
          const blob = await this.convertBase64ToBlob(file);
          const blobUrl = URL.createObjectURL(blob);

          // create <a> tag dinamically
          var fileLink = document.createElement('a');
          fileLink.href = blobUrl;

          // it forces the name of the downloaded file
          fileLink.download = `${this.currentData.fileName}_${this.currentData.year}`;

          // triggers the click event
          fileLink.click();
          // window.location.href = blobUrl;
        }
      });
  }

  public capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  public createCurrentForecastTable(fc: any) {
    let content = `
      <h5>${fc.name}, ${fc.sys.country} </h5> 
      <h6><b>${moment
        .unix(fc.dt)
        .format('MMMM DD YYYY hh:mm A')} , ${this.capitalizeFirstLetter(
      fc.weather[0].description
    )}</b></h6>
      <table class="table table-sm table-bordered">
        <thead>
          <tr>
            <th>Type</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Feels Like</td>
            <td>${fc.main.feels_like} °C</td>
          </tr>
          <tr>
            <td>Humidity</td>
            <td>${fc.main.humidity} %</td>
          </tr>
          <tr>
            <td>Temp</td>
            <td>${fc.main.temp} °C</td>
          </tr>
          <tr>
            <td>Min. Temp</td>
            <td>${fc.main.temp_min} °C</td>
          </tr>
          <tr>
            <td>Max. Temp</td>
            <td>${fc.main.temp_max} °C</td>
          </tr>
          <tr>
            <td>Wind Speed</td>
            <td>${fc.wind.speed} km/h</td>
          </tr>
          <tr>
            <td>Wind Gust</td>
            <td>${fc.wind.gust} km/h</td>
          </tr>
          <tr>
            <td>Wind Direction</td>
            <td>
              <div class="row">
                <div class="col-md-12 col-xs-12">
                    ${fc.wind.deg ? fc.wind.deg : ''} °
                </div>
                <div class="col-md-3 col-xs-3 pr-0">
                  ${
                    fc.wind.deg > 0 ? this.createWindDirection(fc.wind.deg) : ''
                  }
                  
                </div>
                <div class="col-md-9 col-xs-9 pl-0">
                  <span>
                    ${this.windDirectionText(fc.wind.deg ? fc.wind.deg : '')}
                  </span>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td>Rain Volume 1h</td>
            <td>${fc.rain ? fc.rain['1h'] : 0} mm</td>
          </tr>
        </tbody>
      </table>
      `;
    // ${fc.rain['1h']} %</td>

    return content;
  }

  public create3hForecastTable(forecast: any) {
    let content = '';

    for (let fc of forecast.list) {
      content += `
      <h6><b>${moment
        .unix(fc.dt)
        .format('MMMM DD YYYY hh:mm A')} , ${this.capitalizeFirstLetter(
        fc.weather[0].description
      )}</b></h6>
      <table class="table table-sm table-bordered">
        <thead>
          <tr>
            <th>Type</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Feels Like</td>
            <td>${fc.main.feels_like ? fc.main.feels_like : ''} °C</td>
          </tr>
          <tr>
            <td>Humidity</td>
            <td>${fc.main.humidity ? fc.main.humidity : ''} %</td>
          </tr>
          <tr>
            <td>Temp</td>
            <td>${fc.main.temp ? fc.main.temp : ''} °C</td>
          </tr>
          <tr>
            <td>Min. Temp</td>
            <td>${fc.main.temp_min ? fc.main.temp_min : ''} °C</td>
          </tr>
          <tr>
            <td>Max. Temp</td>
            <td>${fc.main.temp_max ? fc.main.temp_max : ''} °C</td>
          </tr>
          <tr>
            <td>Wind Speed</td>
            <td>${fc.wind.speed ? fc.wind.speed : ''} km/h</td>
          </tr>
          <tr>
            <td>Wind Gust</td>
            <td>${fc.wind.gust ? fc.wind.gust : ''} km/h</td>
          </tr>
          <tr>
            <td>Wind Direction</td>
            <td>
            <div class="row">
                <div class="col-md-12 col-xs-12">
                    ${fc.wind.deg ? fc.wind.deg : ''} °
                </div>
                <div class="col-md-3 col-xs-3 pr-0">
                  ${
                    fc.wind.deg > 0 ? this.createWindDirection(fc.wind.deg) : ''
                  }
                  
                </div>
                <div class="col-md-9 col-xs-9 pl-0">
                  <span>
                    ${this.windDirectionText(fc.wind.deg ? fc.wind.deg : '')}
                  </span>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td>Precipitation</td>
            <td>${fc.pop ? fc.pop : 0} %</td>
          </tr>
        </tbody>
      </table>
      <br>
      `;
    }

    return content;
  }

  public createDailyForecastTable(forecast: any) {
    let content = '';

    for (let fc of forecast.list) {
      content += `
      <h6><b>${moment
        .unix(fc.dt)
        .format('MMMM DD YYYY')} , ${this.capitalizeFirstLetter(
        fc.weather[0].description
      )}</b></h6>
      <table class="table table-sm table-bordered">
        <thead>
          <tr>
            <th>Type</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Feels Like Morning</td>
            <td>${fc.feels_like.morn ? fc.feels_like.morn : ''} °C</td>
          </tr>
          <tr>
            <td>Feels Like Day</td>
            <td>${fc.feels_like.day ? fc.feels_like.day : ''} °C</td>
          </tr>
          <tr>
            <td>Feels Like Evening</td>
            <td>${fc.feels_like.eve ? fc.feels_like.eve : ''} °C</td>
          </tr>
          <tr>
            <td>Feels Like Night</td>
            <td>${fc.feels_like.night ? fc.feels_like.night : ''} °C</td>
          </tr>

          <tr>
            <td>Humidity</td>
            <td>${fc.humidity ? fc.humidity : ''} %</td>
          </tr>

          <tr>
            <td>Temp Morning</td>
            <td>${fc.temp.morn ? fc.temp.morn : ''} °C</td>
          </tr>
          <tr>
            <td>Temp Day</td>
            <td>${fc.temp.day ? fc.temp.day : ''} °C</td>
          </tr>
          <tr>
            <td>Temp Evening</td>
            <td>${fc.temp.eve ? fc.temp.eve : ''} °C</td>
          </tr>
          <tr>
            <td>Temp Night</td>
            <td>${fc.temp.night ? fc.temp.night : ''} °C</td>
          </tr>
          <tr>
            <td>Min. Temp</td>
            <td>${fc.temp.min ? fc.temp.min : ''} °C</td>
          </tr>
          <tr>
            <td>Max. Temp</td>
            <td>${fc.temp.max ? fc.temp.max : ''} °C</td>
          </tr>

          <tr>
            <td>Wind Speed</td>
            <td>${fc.speed ? fc.speed : ''} km/h</td>
          </tr>
          <tr>
            <td>Wind Gust</td>
            <td>${fc.gust ? fc.gust : ''} km/h</td>
          </tr>
          <tr>
            <td>Wind Direction</td>
            <td>
              <div class="row">
                <div class="col-md-12 col-xs-12">
                    ${fc.deg ? fc.deg : ''} °
                </div>
                <div class="col-md-3 col-xs-3 pr-0">
                  ${fc.deg > 0 ? this.createWindDirection(fc.deg) : ''}
                  
                </div>
                <div class="col-md-9 col-xs-9 pl-0">
                  <span>
                    ${this.windDirectionText(fc.deg ? fc.deg : '')}
                  </span>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td>Rain</td>
            <td>${fc.rain ? fc.rain : 0} mm</td>
          </tr>
        </tbody>
      </table>
      `;
    }

    return content;
  }

  public updateDistributionMapFile(details: any) {
    this.loadingData = true;
    this.currentData = details;
    this.fileTypeToBeDL = 'none';

    //
    let len = this.stations.length;
    // this.updateHeatMap();
    this.removeLegend();
    this.deleteMarkers();
    this.deleteTIFLayer();

    this.markers = L.layerGroup().addTo(this.map);

    this.xDashService
      .getDistributionMapFile(
        this.API,
        this.authKey,
        this.activeTenant.id,
        details.type,
        details.year,
        details.fileName,
        'csv'
      )
      .subscribe(async (_csv: any) => {
        this.disableDonwload = false;
        let base64CSV = _csv.split(';base64,').pop();

        const buff = Buffer.from(base64CSV, 'base64');
        const str = buff.toString('utf-8');
        let _stationData = this.csv2jso(str);

        _stationData.map((data: any) => {
          data.stationCode = '';
          data.status = '';
        });

        let stations = this.stations;
        var result = _stationData.filter(function (o1: any) {
          return stations.some((o2: any) => {
            o1.stationCode = o2.stationCode;
            return o1.stationName === o2.stationName; // assumes unique id
          });
        });

        len = result.length;

        result.forEach((station: any, index: number) => {
          this.xDashService
            .getStationMeasurementGroupByTime(
              this.API,
              this.authKey,
              this.activeTenant.id,
              station.stationCode,
              details.startDate,
              details.endDate,
              'monthly'
            )
            .subscribe((measurement: any) => {
              if (measurement.collection && details.type === 'Rainfall') {
                station.measurementsRainfall = measurement.collection[0][
                  'Rainfall (0m)'
                ]
                  ? measurement.collection[0]['Rainfall (0m)'].Sum
                  : [];

                if (details.groupByTime === 'monthly') {
                  let startDate = moment()
                    .subtract(1, 'hours')
                    .format('YYYY-MM-DDTHH:mm:ssZ');
                  let endDate = moment().format('YYYY-MM-DDTHH:mm:ssZ');
                  this.getStationMeasurement(
                    station,
                    startDate,
                    endDate
                  ).subscribe((measurement: any) => {
                    if (measurement.collection) {
                      station.measurementAirDelta = measurement.collection[0][
                        'Air Delta T (2m)'
                      ]
                        ? measurement.collection[0]['Air Delta T (2m)']
                        : [];
                      station.measurementsAirHumidity = measurement
                        .collection[0]['Air Humidity (2m)']
                        ? measurement.collection[0]['Air Humidity (2m)']
                        : [];
                      station.measurementsAirTemperature = measurement
                        .collection[0]['Air Temperature (2m)']
                        ? measurement.collection[0]['Air Temperature (2m)']
                        : [];
                      station.measurementsAirWindDir = measurement
                        .collection[0]['Air Wind Direction (6m)']
                        ? measurement.collection[0]['Air Wind Direction (6m)']
                        : [];
                      station.measurementsAirWindGust = measurement
                        .collection[0]['Air Wind Gust (Gust)']
                        ? measurement.collection[0]['Air Wind Gust (Gust)']
                        : [];
                      station.measurementsAirWindSpeed = measurement
                        .collection[0]['Air Wind Speed (Avg)']
                        ? measurement.collection[0]['Air Wind Speed (Avg)']
                        : [];
                      station.measurementsInternalBatBox = measurement
                        .collection[0]['Internal Battery (box)']
                        ? measurement.collection[0]['Internal Battery (box)']
                        : [];
                      station.measurementsInternalTemp = measurement
                        .collection[0]['Internal Temperature (box)']
                        ? measurement.collection[0][
                            'Internal Temperature (box)'
                          ]
                        : [];
                      station.measurementsRainfallSpec = measurement
                        .collection[0]['Rainfall (0m)']
                        ? measurement.collection[0]['Rainfall (0m)']
                        : [];
                    }

                    let rainFallDate = '';
                    let rainFallValue = '';
                    if (station.measurementsRainfall.length === 2) {
                      rainFallDate = station.measurementsRainfall[1][0];
                      rainFallValue = station.measurementsRainfall[1][1];
                    } else if (station.measurementsRainfall.length === 2) {
                      rainFallDate = station.measurementsRainfall[0][0];
                      rainFallValue = station.measurementsRainfall[0][1];
                    }
                    let content = `
                      <h4>Weather Station Details</h4>
                      Station Name: ${station.stationName}<br>
                      Station Code: ${station.stationCode}<br>
                      Status: ${station.status}<br>
                      Latitude: ${station.latitude}<br>
                      Longitude: ${station.longitude}<br>
                      <h6><b>${details.type} ${moment(rainFallDate).format(
                      'MMMM YYYY'
                    )}: ${station.value}</b></h6>
                      <a href="https://cloud.origo.ag/#!/station?id=${
                        station.stationCode
                      }&type=weather%20stations">Go to station page</a><br><br>
                      <h6>Measurements 
                        <span>
                          ${
                            station.measurementAirDelta.length > 0
                              ? moment(
                                  station.measurementAirDelta[0][0]
                                ).format('MMMM DD YYYY hh:mm A')
                              : ''
                          }
                        </span>
                      </h6>
                      </b></h6>
                      <table class="table table-sm table-bordered">
                        <thead>
                          <th>Type</th>
                          <th>Value</th>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Air Delta (2m)</td>
                            <td>${
                              station.measurementAirDelta.length > 0
                                ? station.measurementAirDelta[0][1]
                                : 0
                            } °C</td>
                          </tr>
                          <tr>
                            <td>Air Humidity (2m)</td>
                            <td>${
                              station.measurementsAirHumidity.length > 0
                                ? station.measurementsAirHumidity[0][1]
                                : 0
                            } %</td>
                          </tr>
                          <tr>
                            <td>Air Temperature (2m)</td>
                            <td>${
                              station.measurementsAirTemperature.length > 0
                                ? station.measurementsAirTemperature[0][1]
                                : 0
                            } °C</td>
                          </tr>
                          <tr>
                            <td>Air Wind Direction (6m)</td>
                            <td>
                              <div class="row">
                                <div class="col-md-12 col-xs-12">
                                    ${
                                      station.measurementsAirWindDir &&
                                      station.measurementsAirWindDir.length > 0
                                        ? station.measurementsAirWindDir[0][1]
                                        : ''
                                    } °
                                </div>
                                <div class="col-md-3 col-xs-3 pr-0">
                                  ${
                                    station.measurementsAirWindDir &&
                                    station.measurementsAirWindDir.length > 0
                                      ? this.createWindDirection(
                                          station.measurementsAirWindDir[0][1]
                                        )
                                      : ''
                                  }
                                  
                                </div>
                                <div class="col-md-9 col-xs-9 pl-0">
                                  <span>
                                    ${this.windDirectionText(
                                      station.measurementsAirWindDir &&
                                        station.measurementsAirWindDir.length >
                                          0
                                        ? station.measurementsAirWindDir[0][1]
                                        : ''
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>Air Wind Gust (Gust)</td>
                            <td>${
                              station.measurementsAirWindGust.length > 0
                                ? station.measurementsAirWindGust[0][1]
                                : 0
                            } km/h</td>
                          </tr>
                          <tr>
                            <td>Air Wind Speed (Avg)</td>
                            <td>${
                              station.measurementsAirWindSpeed.length > 0
                                ? station.measurementsAirWindSpeed[0][1]
                                : 0
                            } km/h</td>
                          </tr>
                          <tr>
                            <td>Rainfall (0m)</td>
                            <td>${
                              station.measurementsRainfall.length > 0
                                ? station.measurementsRainfall[0][1]
                                : 0
                            } mm</td>
                          </tr>
                        </tbody>
                      </table>
                    `;

                    this.createMarkerNew(
                      station,
                      details.startDate,
                      details.endDate,
                      'monthly',
                      details.type,
                      details.groupByTime,
                      content
                    );
                  });
                }

                if (details.groupByTime === 'yearly') {
                  let total = 0;
                  let average = 0;
                  let len = station.measurementsRainfall.length;

                  station.measurementsRainfall.forEach((value: any) => {
                    total = total + parseFloat(value[1]);
                  });
                  average = total / len;

                  let startDate = moment()
                    .subtract(1, 'hours')
                    .format('YYYY-MM-DDTHH:mm:ssZ');
                  let endDate = moment().format('YYYY-MM-DDTHH:mm:ssZ');
                  this.getStationMeasurement(
                    station,
                    startDate,
                    endDate
                  ).subscribe((measurement: any) => {
                    if (measurement.collection) {
                      station.measurementAirDelta = measurement.collection[0][
                        'Air Delta T (2m)'
                      ]
                        ? measurement.collection[0]['Air Delta T (2m)']
                        : [];
                      station.measurementsAirHumidity = measurement
                        .collection[0]['Air Humidity (2m)']
                        ? measurement.collection[0]['Air Humidity (2m)']
                        : [];
                      station.measurementsAirTemperature = measurement
                        .collection[0]['Air Temperature (2m)']
                        ? measurement.collection[0]['Air Temperature (2m)']
                        : [];
                      station.measurementsAirWindDir = measurement
                        .collection[0]['Air Wind Direction (6m)']
                        ? measurement.collection[0]['Air Wind Direction (6m)']
                        : [];
                      station.measurementsAirWindGust = measurement
                        .collection[0]['Air Wind Gust (Gust)']
                        ? measurement.collection[0]['Air Wind Gust (Gust)']
                        : [];
                      station.measurementsAirWindSpeed = measurement
                        .collection[0]['Air Wind Speed (Avg)']
                        ? measurement.collection[0]['Air Wind Speed (Avg)']
                        : [];
                      station.measurementsInternalBatBox = measurement
                        .collection[0]['Internal Battery (box)']
                        ? measurement.collection[0]['Internal Battery (box)']
                        : [];
                      station.measurementsInternalTemp = measurement
                        .collection[0]['Internal Temperature (box)']
                        ? measurement.collection[0][
                            'Internal Temperature (box)'
                          ]
                        : [];
                      station.measurementsRainfallSpec = measurement
                        .collection[0]['Rainfall (0m)']
                        ? measurement.collection[0]['Rainfall (0m)']
                        : [];
                    }

                    let content = `
                      <h4>Weather Station Details</h4>
                      Station Name: ${station.stationName}<br>
                      Station Code: ${station.stationCode}<br>
                      Status: ${station.status}<br>
                      Latitude: ${station.latitude}<br>
                      Longitude: ${station.longitude}<br>
                      <a href="https://cloud.origo.ag/#!/station?id=${
                        station.stationCode
                      }&type=weather%20stations">Go to station page</a><br><br>
                      <h6><b>Annual ${details.type} ${moment(
                      station.measurementsRainfall[1][0]
                    ).format('YYYY')}: ${station.value}</b></h6>
                      <h4>Measurements</h4>
                      <table class="table table-sm table-bordered">
                        <thead>
                          <th>Type</th>
                          <th>Value</th>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Air Delta (2m)</td>
                            <td>${
                              station.measurementAirDelta.length > 0
                                ? station.measurementAirDelta[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Air Humidity (2m)</td>
                            <td>${
                              station.measurementsAirHumidity.length > 0
                                ? station.measurementsAirHumidity[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Air Temperature (2m)</td>
                            <td>${
                              station.measurementsAirTemperature.length > 0
                                ? station.measurementsAirTemperature[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Air Wind Direction (6m)</td>
                            <td>
                              <div class="row">
                                <div class="col-md-12 col-xs-12">
                                    ${
                                      station.measurementsAirWindDir &&
                                      station.measurementsAirWindDir.length > 0
                                        ? station.measurementsAirWindDir[0][1]
                                        : ''
                                    } °
                                </div>
                                <div class="col-md-3 col-xs-3 pr-0">
                                  ${
                                    station.measurementsAirWindDir &&
                                    station.measurementsAirWindDir.length > 0
                                      ? this.createWindDirection(
                                          station.measurementsAirWindDir[0][1]
                                        )
                                      : ''
                                  }
                                  
                                </div>
                                <div class="col-md-9 col-xs-9 pl-0">
                                  <span>
                                    ${this.windDirectionText(
                                      station.measurementsAirWindDir &&
                                        station.measurementsAirWindDir.length >
                                          0
                                        ? station.measurementsAirWindDir[0][1]
                                        : ''
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>Air Wind Gust (Gust)</td>
                            <td>${
                              station.measurementsAirWindGust.length > 0
                                ? station.measurementsAirWindGust[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Air Wind Speed (Avg)</td>
                            <td>${
                              station.measurementsAirWindSpeed.length > 0
                                ? station.measurementsAirWindSpeed[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Rainfall (0m)</td>
                            <td>${
                              station.measurementsRainfallSpec.length > 0
                                ? station.measurementsRainfallSpec[0][1]
                                : 0
                            }</td>
                          </tr>
                        </tbody>
                      </table>
                    `;

                    this.createMarkerNew(
                      station,
                      details.startDate,
                      details.endDate,
                      'monthly',
                      details.type,
                      details.groupByTime,
                      content
                    );
                  });
                }
              }

              if (
                measurement.collection &&
                details.type === 'Max_Temperature'
              ) {
                var maxTempArray = [];
                let maxTemp = 0;
                if (measurement.collection[0]['Air Temperature (0m)']) {
                  station.measurementsMaxAirTemperature = measurement
                    .collection[0]['Air Temperature (0m)'].Max
                    ? measurement.collection[0]['Air Temperature (0m)'].Max
                    : [];
                  for (let data of measurement.collection[0][
                    'Air Temperature (0m)'
                  ].Max) {
                    maxTempArray.push(parseFloat(data[1]));
                  }
                }
                if (measurement.collection[0]['Air Temperature (2m)']) {
                  station.measurementsMaxAirTemperature = measurement
                    .collection[0]['Air Temperature (2m)'].Max
                    ? measurement.collection[0]['Air Temperature (2m)'].Max
                    : [];
                  for (let data of measurement.collection[0][
                    'Air Temperature (2m)'
                  ].Max) {
                    maxTempArray.push(parseFloat(data[1]));
                  }
                }
                if (measurement.collection[0]['Air Temperature (3m)']) {
                  station.measurementsMaxAirTemperature = measurement
                    .collection[0]['Air Temperature (3m)'].Max
                    ? measurement.collection[0]['Air Temperature (3m)'].Max
                    : [];
                  for (let data of measurement.collection[0][
                    'Air Temperature (3m)'
                  ].Max) {
                    maxTempArray.push(parseFloat(data[1]));
                  }
                }
                if (measurement.collection[0]['Air Temperature (6m)']) {
                  station.measurementsMaxAirTemperature = measurement
                    .collection[0]['Air Temperature (6m)'].Max
                    ? measurement.collection[0]['Air Temperature (6m)'].Max
                    : [];
                  for (let data of measurement.collection[0][
                    'Air Temperature (6m)'
                  ].Max) {
                    maxTempArray.push(parseFloat(data[1]));
                  }
                }

                maxTemp = Math.max(...maxTempArray);

                if (details.groupByTime === 'monthly') {
                  let startDate = moment()
                    .subtract(1, 'hours')
                    .format('YYYY-MM-DDTHH:mm:ssZ');
                  let endDate = moment().format('YYYY-MM-DDTHH:mm:ssZ');
                  this.getStationMeasurement(
                    station,
                    startDate,
                    endDate
                  ).subscribe((measurement: any) => {
                    if (measurement.collection) {
                      station.measurementAirDelta = measurement.collection[0][
                        'Air Delta T (2m)'
                      ]
                        ? measurement.collection[0]['Air Delta T (2m)']
                        : [];
                      station.measurementsAirHumidity = measurement
                        .collection[0]['Air Humidity (2m)']
                        ? measurement.collection[0]['Air Humidity (2m)']
                        : [];
                      station.measurementsAirTemperature = measurement
                        .collection[0]['Air Temperature (2m)']
                        ? measurement.collection[0]['Air Temperature (2m)']
                        : [];
                      station.measurementsAirWindDir = measurement
                        .collection[0]['Air Wind Direction (6m)']
                        ? measurement.collection[0]['Air Wind Direction (6m)']
                        : [];
                      station.measurementsAirWindGust = measurement
                        .collection[0]['Air Wind Gust (Gust)']
                        ? measurement.collection[0]['Air Wind Gust (Gust)']
                        : [];
                      station.measurementsAirWindSpeed = measurement
                        .collection[0]['Air Wind Speed (Avg)']
                        ? measurement.collection[0]['Air Wind Speed (Avg)']
                        : [];
                      station.measurementsInternalBatBox = measurement
                        .collection[0]['Internal Battery (box)']
                        ? measurement.collection[0]['Internal Battery (box)']
                        : [];
                      station.measurementsInternalTemp = measurement
                        .collection[0]['Internal Temperature (box)']
                        ? measurement.collection[0][
                            'Internal Temperature (box)'
                          ]
                        : [];
                      station.measurementsRainfallSpec = measurement
                        .collection[0]['Rainfall (0m)']
                        ? measurement.collection[0]['Rainfall (0m)']
                        : [];
                    }

                    // this.getStation3hForeCast(
                    //   String(station.latitude),
                    //   String(station.longitude)
                    // ).subscribe((forecast: any) => {
                    //   this.getStationCurrentForeCast(
                    //     String(station.latitude),
                    //     String(station.longitude)
                    //   ).subscribe((forecastCurrent: any) => {
                    //     this.getStationDailyForeCast(
                    //       String(station.latitude),
                    //       String(station.longitude)
                    //     ).subscribe((forecastDaily: any) => {
                    let content = `
                      <h4>Weather Station Details</h4>
                      Station Name: ${station.stationName}<br>
                      Station Code: ${station.stationCode}<br>
                      Status: ${station.status}<br>
                      Latitude: ${station.latitude}<br>
                      Longitude: ${station.longitude}<br>
                      <h6><b>${details.type} ${
                      // station.measurementsMaxAirTemperature[0][0]
                      station.measurementsMaxAirTemperature
                        ? station.measurementsMaxAirTemperature[0][0]
                        : ''
                    }: ${station.value}</b></h6>
                      <a href="https://cloud.origo.ag/#!/station?id=${
                        station.stationCode
                      }&type=weather%20stations">Go to station page</a><br><br>
                      <h6>Measurements 
                        <span>
                          ${
                            station.measurementsMaxAirTemperature.length > 0
                              ? moment(
                                  station.measurementsMaxAirTemperature[0][0]
                                ).format('MMMM DD YYYY hh:mm A')
                              : ''
                          }
                        </span>
                      </h6>
                      <table class="table table-sm table-bordered">
                        <thead>
                          <th>Type</th>
                          <th>Value</th>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Air Delta (2m)</td>
                            <td>${
                              station.measurementAirDelta.length > 0
                                ? station.measurementAirDelta[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Air Humidity (2m)</td>
                            <td>${
                              station.measurementsAirHumidity.length > 0
                                ? station.measurementsAirHumidity[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Air Temperature (2m)</td>
                            <td>${
                              station.measurementsAirTemperature.length > 0
                                ? station.measurementsAirTemperature[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Air Wind Direction (6m)</td>
                            <td>
                              <div class="row">
                                <div class="col-md-12 col-xs-12">
                                    ${
                                      station.measurementsAirWindDir &&
                                      station.measurementsAirWindDir.length > 0
                                        ? station.measurementsAirWindDir[0][1]
                                        : ''
                                    } °
                                </div>
                                <div class="col-md-3 col-xs-3 pr-0">
                                  ${
                                    station.measurementsAirWindDir &&
                                    station.measurementsAirWindDir.length > 0
                                      ? this.createWindDirection(
                                          station.measurementsAirWindDir[0][1]
                                        )
                                      : ''
                                  }
                                  
                                </div>
                                <div class="col-md-9 col-xs-9 pl-0">
                                  <span>
                                    ${this.windDirectionText(
                                      station.measurementsAirWindDir &&
                                        station.measurementsAirWindDir.length >
                                          0
                                        ? station.measurementsAirWindDir[0][1]
                                        : ''
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>Air Wind Gust (Gust)</td>
                            <td>${
                              station.measurementsAirWindGust.length > 0
                                ? station.measurementsAirWindGust[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Air Wind Speed (Avg)</td>
                            <td>${
                              station.measurementsAirWindSpeed.length > 0
                                ? station.measurementsAirWindSpeed[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Rainfall (0m)</td>
                            <td>${
                              station.measurementsRainfallSpec.length > 0
                                ? station.measurementsRainfallSpec[0][1]
                                : 0
                            }</td>
                          </tr>
                        </tbody>
                      </table>
                    `;

                    this.createMarkerNew(
                      station,
                      details.startDate,
                      details.endDate,
                      'monthly',
                      details.type,
                      details.groupByTime,
                      content
                    );
                  });
                }
                if (details.groupByTime === 'yearly') {
                  let startDate = moment()
                    .subtract(1, 'hours')
                    .format('YYYY-MM-DDTHH:mm:ssZ');
                  let endDate = moment().format('YYYY-MM-DDTHH:mm:ssZ');
                  this.getStationMeasurement(
                    station,
                    startDate,
                    endDate
                  ).subscribe((measurement: any) => {
                    if (measurement.collection) {
                      station.measurementAirDelta = measurement.collection[0][
                        'Air Delta T (2m)'
                      ]
                        ? measurement.collection[0]['Air Delta T (2m)']
                        : [];
                      station.measurementsAirHumidity = measurement
                        .collection[0]['Air Humidity (2m)']
                        ? measurement.collection[0]['Air Humidity (2m)']
                        : [];
                      station.measurementsAirTemperature = measurement
                        .collection[0]['Air Temperature (2m)']
                        ? measurement.collection[0]['Air Temperature (2m)']
                        : [];
                      station.measurementsAirWindDir = measurement
                        .collection[0]['Air Wind Direction (6m)']
                        ? measurement.collection[0]['Air Wind Direction (6m)']
                        : [];
                      station.measurementsAirWindGust = measurement
                        .collection[0]['Air Wind Gust (Gust)']
                        ? measurement.collection[0]['Air Wind Gust (Gust)']
                        : [];
                      station.measurementsAirWindSpeed = measurement
                        .collection[0]['Air Wind Speed (Avg)']
                        ? measurement.collection[0]['Air Wind Speed (Avg)']
                        : [];
                      station.measurementsInternalBatBox = measurement
                        .collection[0]['Internal Battery (box)']
                        ? measurement.collection[0]['Internal Battery (box)']
                        : [];
                      station.measurementsInternalTemp = measurement
                        .collection[0]['Internal Temperature (box)']
                        ? measurement.collection[0][
                            'Internal Temperature (box)'
                          ]
                        : [];
                      station.measurementsRainfallSpec = measurement
                        .collection[0]['Rainfall (0m)']
                        ? measurement.collection[0]['Rainfall (0m)']
                        : [];
                    }

                    // this.getStation3hForeCast(
                    //   String(station.latitude),
                    //   String(station.longitude)
                    // ).subscribe((forecast: any) => {
                    //   this.getStationCurrentForeCast(
                    //     String(station.latitude),
                    //     String(station.longitude)
                    //   ).subscribe((forecastCurrent: any) => {
                    //     this.getStationDailyForeCast(
                    //       String(station.latitude),
                    //       String(station.longitude)
                    //     ).subscribe((forecastDaily: any) => {
                    let content = `
                      <h4>Weather Station Details</h4>
                      Station Name: ${station.stationName}<br>
                      Station Code: ${station.stationCode}<br>
                      Status: ${station.status}<br>
                      Latitude: ${station.latitude}<br>
                      Longitude: ${station.longitude}<br>
                      <h6><b>${details.type} ${
                      station.measurementsMaxAirTemperature
                        ? moment(
                            station.measurementsMaxAirTemperature[0][0]
                          ).format('YYYY')
                        : ''
                    } annual summary: ${station.value}</b></h6>
                      
                      <a href="https://cloud.origo.ag/#!/station?id=${
                        station.stationCode
                      }&type=weather%20stations">Go to station page</a><br><br>
                      <h6>Measurements 
                        <span>
                          ${
                            station.measurementsMaxAirTemperature.length > 0
                              ? moment(
                                  station.measurementsMaxAirTemperature[0][0]
                                ).format('MMMM DD YYYY hh:mm A')
                              : ''
                          }
                        </span>
                      </h6>

                      <table class="table table-sm table-bordered">
                        <thead>
                          <th>Type</th>
                          <th>Value</th>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Air Delta (2m)</td>
                            <td>${
                              station.measurementAirDelta.length > 0
                                ? station.measurementAirDelta[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Air Humidity (2m)</td>
                            <td>${
                              station.measurementsAirHumidity.length > 0
                                ? station.measurementsAirHumidity[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Air Temperature (2m)</td>
                            <td>${
                              station.measurementsAirTemperature.length > 0
                                ? station.measurementsAirTemperature[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Air Wind Direction (6m)</td>
                            <td>
                              <div class="row">
                                <div class="col-md-12 col-xs-12">
                                    ${
                                      station.measurementsAirWindDir &&
                                      station.measurementsAirWindDir.length > 0
                                        ? station.measurementsAirWindDir[0][1]
                                        : ''
                                    } °
                                </div>
                                <div class="col-md-3 col-xs-3 pr-0">
                                  ${
                                    station.measurementsAirWindDir &&
                                    station.measurementsAirWindDir.length > 0
                                      ? this.createWindDirection(
                                          station.measurementsAirWindDir[0][1]
                                        )
                                      : ''
                                  }
                                  
                                </div>
                                <div class="col-md-9 col-xs-9 pl-0">
                                  <span>
                                    ${this.windDirectionText(
                                      station.measurementsAirWindDir &&
                                        station.measurementsAirWindDir.length >
                                          0
                                        ? station.measurementsAirWindDir[0][1]
                                        : ''
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>Air Wind Gust (Gust)</td>
                            <td>${
                              station.measurementsAirWindGust.length > 0
                                ? station.measurementsAirWindGust[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Air Wind Speed (Avg)</td>
                            <td>${
                              station.measurementsAirWindSpeed.length > 0
                                ? station.measurementsAirWindSpeed[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Rainfall (0m)</td>
                            <td>${
                              station.measurementsRainfallSpec.length > 0
                                ? station.measurementsRainfallSpec[0][1]
                                : 0
                            }</td>
                          </tr>
                        </tbody>
                      </table>
                    `;

                    this.createMarkerNew(
                      station,
                      details.startDate,
                      details.endDate,
                      'monthly',
                      details.type,
                      details.groupByTime,
                      content
                    );
                  });
                }
              }

              if (
                measurement.collection &&
                details.type === 'Min_Temperature'
              ) {
                var minTempArray = [];
                let minTemp = 0;
                if (measurement.collection[0]['Air Temperature (0m)']) {
                  station.measurementsMinAirTemperature = measurement
                    .collection[0]['Air Temperature (0m)'].Min
                    ? measurement.collection[0]['Air Temperature (0m)'].Min
                    : [];
                  for (let data of measurement.collection[0][
                    'Air Temperature (0m)'
                  ].Min) {
                    minTempArray.push(parseFloat(data[1]));
                  }
                }
                if (measurement.collection[0]['Air Temperature (2m)']) {
                  station.measurementsMinAirTemperature = measurement
                    .collection[0]['Air Temperature (2m)'].Min
                    ? measurement.collection[0]['Air Temperature (2m)'].Min
                    : [];
                  for (let data of measurement.collection[0][
                    'Air Temperature (2m)'
                  ].Min) {
                    minTempArray.push(parseFloat(data[1]));
                  }
                }
                if (measurement.collection[0]['Air Temperature (3m)']) {
                  station.measurementsMinAirTemperature = measurement
                    .collection[0]['Air Temperature (3m)'].Min
                    ? measurement.collection[0]['Air Temperature (3m)'].Min
                    : [];
                  for (let data of measurement.collection[0][
                    'Air Temperature (3m)'
                  ].Min) {
                    minTempArray.push(parseFloat(data[1]));
                  }
                }
                if (measurement.collection[0]['Air Temperature (6m)']) {
                  station.measurementsMinAirTemperature = measurement
                    .collection[0]['Air Temperature (6m)'].Min
                    ? measurement.collection[0]['Air Temperature (6m)'].Min
                    : [];
                  for (let data of measurement.collection[0][
                    'Air Temperature (6m)'
                  ].Min) {
                    minTempArray.push(parseFloat(data[1]));
                  }
                }

                minTemp = Math.min(...minTempArray);

                if (details.groupByTime === 'monthly') {
                  let startDate = moment()
                    .subtract(1, 'hours')
                    .format('YYYY-MM-DDTHH:mm:ssZ');
                  let endDate = moment().format('YYYY-MM-DDTHH:mm:ssZ');
                  this.getStationMeasurement(
                    station,
                    startDate,
                    endDate
                  ).subscribe((measurement: any) => {
                    if (measurement.collection) {
                      station.measurementAirDelta = measurement.collection[0][
                        'Air Delta T (2m)'
                      ]
                        ? measurement.collection[0]['Air Delta T (2m)']
                        : [];
                      station.measurementsAirHumidity = measurement
                        .collection[0]['Air Humidity (2m)']
                        ? measurement.collection[0]['Air Humidity (2m)']
                        : [];
                      station.measurementsAirTemperature = measurement
                        .collection[0]['Air Temperature (2m)']
                        ? measurement.collection[0]['Air Temperature (2m)']
                        : [];
                      station.measurementsAirWindDir = measurement
                        .collection[0]['Air Wind Direction (6m)']
                        ? measurement.collection[0]['Air Wind Direction (6m)']
                        : [];
                      station.measurementsAirWindGust = measurement
                        .collection[0]['Air Wind Gust (Gust)']
                        ? measurement.collection[0]['Air Wind Gust (Gust)']
                        : [];
                      station.measurementsAirWindSpeed = measurement
                        .collection[0]['Air Wind Speed (Avg)']
                        ? measurement.collection[0]['Air Wind Speed (Avg)']
                        : [];
                      station.measurementsInternalBatBox = measurement
                        .collection[0]['Internal Battery (box)']
                        ? measurement.collection[0]['Internal Battery (box)']
                        : [];
                      station.measurementsInternalTemp = measurement
                        .collection[0]['Internal Temperature (box)']
                        ? measurement.collection[0][
                            'Internal Temperature (box)'
                          ]
                        : [];
                      station.measurementsRainfallSpec = measurement
                        .collection[0]['Rainfall (0m)']
                        ? measurement.collection[0]['Rainfall (0m)']
                        : [];
                    }

                    // this.getStation3hForeCast(
                    //   String(station.latitude),
                    //   String(station.longitude)
                    // ).subscribe((forecast: any) => {
                    //   this.getStationCurrentForeCast(
                    //     String(station.latitude),
                    //     String(station.longitude)
                    //   ).subscribe((forecastCurrent: any) => {
                    //     this.getStationDailyForeCast(
                    //       String(station.latitude),
                    //       String(station.longitude)
                    //     ).subscribe((forecastDaily: any) => {
                    let content = `
                      <h4>Weather Station Details</h4>
                      Station Name: ${station.stationName}<br>
                      Station Code: ${station.stationCode}<br>
                      Status: ${station.status}<br>
                      Latitude: ${station.latitude}<br>
                      Longitude: ${station.longitude}<br>
                      <h6><b>${details.type} ${
                      station.measurementsMinAirTemperature
                        ? station.measurementsMinAirTemperature[0][0]
                        : ''
                    }: ${station.value}</b></h6>

                      <a href="https://cloud.origo.ag/#!/station?id=${
                        station.stationCode
                      }&type=weather%20stations">Go to station page</a><br><br>
                      <h6>Measurements 
                        <span>
                          ${
                            station.measurementsMinAirTemperature.length > 0
                              ? moment(
                                  station.measurementsMinAirTemperature[0][0]
                                ).format('MMMM DD YYYY hh:mm A')
                              : ''
                          }
                        </span>
                      </h6>

                      <table class="table table-sm table-bordered">
                        <thead>
                          <th>Type</th>
                          <th>Value</th>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Air Delta (2m)</td>
                            <td>${
                              station.measurementAirDelta.length > 0
                                ? station.measurementAirDelta[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Air Humidity (2m)</td>
                            <td>${
                              station.measurementsAirHumidity.length > 0
                                ? station.measurementsAirHumidity[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Air Temperature (2m)</td>
                            <td>${
                              station.measurementsAirTemperature.length > 0
                                ? station.measurementsAirTemperature[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Air Wind Direction (6m)</td>
                            <td>
                              <div class="row">
                                <div class="col-md-12 col-xs-12">
                                    ${
                                      station.measurementsAirWindDir &&
                                      station.measurementsAirWindDir.length > 0
                                        ? station.measurementsAirWindDir[0][1]
                                        : ''
                                    } °
                                </div>
                                <div class="col-md-3 col-xs-3 pr-0">
                                  ${
                                    station.measurementsAirWindDir &&
                                    station.measurementsAirWindDir.length > 0
                                      ? this.createWindDirection(
                                          station.measurementsAirWindDir[0][1]
                                        )
                                      : ''
                                  }
                                  
                                </div>
                                <div class="col-md-9 col-xs-9 pl-0">
                                  <span>
                                    ${this.windDirectionText(
                                      station.measurementsAirWindDir &&
                                        station.measurementsAirWindDir.length >
                                          0
                                        ? station.measurementsAirWindDir[0][1]
                                        : ''
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>Air Wind Gust (Gust)</td>
                            <td>${
                              station.measurementsAirWindGust.length > 0
                                ? station.measurementsAirWindGust[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Air Wind Speed (Avg)</td>
                            <td>${
                              station.measurementsAirWindSpeed.length > 0
                                ? station.measurementsAirWindSpeed[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Rainfall (0m)</td>
                            <td>${
                              station.measurementsRainfallSpec.length > 0
                                ? station.measurementsRainfallSpec[0][1]
                                : 0
                            }</td>
                          </tr>
                        </tbody>
                      </table>
                    `;

                    this.createMarkerNew(
                      station,
                      details.startDate,
                      details.endDate,
                      'monthly',
                      details.type,
                      details.groupByTime,
                      content
                    );
                  });
                }

                if (details.groupByTime === 'yearly') {
                  let startDate = moment()
                    .subtract(1, 'hours')
                    .format('YYYY-MM-DDTHH:mm:ssZ');
                  let endDate = moment().format('YYYY-MM-DDTHH:mm:ssZ');
                  this.getStationMeasurement(
                    station,
                    startDate,
                    endDate
                  ).subscribe((measurement: any) => {
                    if (measurement.collection) {
                      station.measurementAirDelta = measurement.collection[0][
                        'Air Delta T (2m)'
                      ]
                        ? measurement.collection[0]['Air Delta T (2m)']
                        : [];
                      station.measurementsAirHumidity = measurement
                        .collection[0]['Air Humidity (2m)']
                        ? measurement.collection[0]['Air Humidity (2m)']
                        : [];
                      station.measurementsAirTemperature = measurement
                        .collection[0]['Air Temperature (2m)']
                        ? measurement.collection[0]['Air Temperature (2m)']
                        : [];
                      station.measurementsAirWindDir = measurement
                        .collection[0]['Air Wind Direction (6m)']
                        ? measurement.collection[0]['Air Wind Direction (6m)']
                        : [];
                      station.measurementsAirWindGust = measurement
                        .collection[0]['Air Wind Gust (Gust)']
                        ? measurement.collection[0]['Air Wind Gust (Gust)']
                        : [];
                      station.measurementsAirWindSpeed = measurement
                        .collection[0]['Air Wind Speed (Avg)']
                        ? measurement.collection[0]['Air Wind Speed (Avg)']
                        : [];
                      station.measurementsInternalBatBox = measurement
                        .collection[0]['Internal Battery (box)']
                        ? measurement.collection[0]['Internal Battery (box)']
                        : [];
                      station.measurementsInternalTemp = measurement
                        .collection[0]['Internal Temperature (box)']
                        ? measurement.collection[0][
                            'Internal Temperature (box)'
                          ]
                        : [];
                      station.measurementsRainfallSpec = measurement
                        .collection[0]['Rainfall (0m)']
                        ? measurement.collection[0]['Rainfall (0m)']
                        : [];
                    }

                    // this.getStation3hForeCast(
                    //   String(station.latitude),
                    //   String(station.longitude)
                    // ).subscribe((forecast: any) => {
                    //   this.getStationCurrentForeCast(
                    //     String(station.latitude),
                    //     String(station.longitude)
                    //   ).subscribe((forecastCurrent: any) => {
                    //     this.getStationDailyForeCast(
                    //       String(station.latitude),
                    //       String(station.longitude)
                    //     ).subscribe((forecastDaily: any) => {
                    let content = `
                      <h4>Weather Station Details</h4>
                      Station Name: ${station.stationName}<br>
                      Station Code: ${station.stationCode}<br>
                      Status: ${station.status}<br>
                      Latitude: ${station.latitude}<br>
                      Longitude: ${station.longitude}<br>
                      <h6><b>${details.type} ${
                      station.measurementsMinAirTemperature
                        ? moment(
                            station.measurementsMinAirTemperature[0][0]
                          ).format('YYYY')
                        : ''
                    } annual summary: ${station.value}</b></h6>

                      <a href="https://cloud.origo.ag/#!/station?id=${
                        station.stationCode
                      }&type=weather%20stations">Go to station page</a><br><br>
                      <h6>Measurements 
                        <span>
                          ${
                            station.measurementsMinAirTemperature.length > 0
                              ? moment(
                                  station.measurementsMinAirTemperature[0][0]
                                ).format('MMMM DD YYYY hh:mm A')
                              : ''
                          }
                        </span>
                      </h6>

                      <table class="table table-sm table-bordered">
                        <thead>
                          <th>Type</th>
                          <th>Value</th>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Air Delta (2m)</td>
                            <td>${
                              station.measurementAirDelta.length > 0
                                ? station.measurementAirDelta[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Air Humidity (2m)</td>
                            <td>${
                              station.measurementsAirHumidity.length > 0
                                ? station.measurementsAirHumidity[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Air Temperature (2m)</td>
                            <td>${
                              station.measurementsAirTemperature.length > 0
                                ? station.measurementsAirTemperature[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Air Wind Direction (6m)</td>
                            <td>
                              <div class="row">
                                <div class="col-md-12 col-xs-12">
                                    ${
                                      station.measurementsAirWindDir &&
                                      station.measurementsAirWindDir.length > 0
                                        ? station.measurementsAirWindDir[0][1]
                                        : ''
                                    } °
                                </div>
                                <div class="col-md-3 col-xs-3 pr-0">
                                  ${
                                    station.measurementsAirWindDir &&
                                    station.measurementsAirWindDir.length > 0
                                      ? this.createWindDirection(
                                          station.measurementsAirWindDir[0][1]
                                        )
                                      : ''
                                  }
                                  
                                </div>
                                <div class="col-md-9 col-xs-9 pl-0">
                                  <span>
                                    ${this.windDirectionText(
                                      station.measurementsAirWindDir &&
                                        station.measurementsAirWindDir.length >
                                          0
                                        ? station.measurementsAirWindDir[0][1]
                                        : ''
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>Air Wind Gust (Gust)</td>
                            <td>${
                              station.measurementsAirWindGust.length > 0
                                ? station.measurementsAirWindGust[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Air Wind Speed (Avg)</td>
                            <td>${
                              station.measurementsAirWindSpeed.length > 0
                                ? station.measurementsAirWindSpeed[0][1]
                                : 0
                            }</td>
                          </tr>
                          <tr>
                            <td>Rainfall (0m)</td>
                            <td>${
                              station.measurementsRainfallSpec.length > 0
                                ? station.measurementsRainfallSpec[0][1]
                                : 0
                            }</td>
                          </tr>
                        </tbody>
                      </table>
                    `;

                    this.createMarkerNew(
                      station,
                      details.startDate,
                      details.endDate,
                      'monthly',
                      details.type,
                      details.groupByTime,
                      content
                    );
                  });
                }
              }
              if (len === index + 1) {
                this.xDashService
                  .getDistributionMapFile(
                    this.API,
                    this.authKey,
                    this.activeTenant.id,
                    details.type,
                    details.year,
                    details.fileName,
                    'tif'
                  )
                  .subscribe(async (tif: any) => {
                    // let blobFile = await this.convertBase64ToBlob(tif);
                    // // Load our data tile from url, arraybuffer, or blob, so we can work with it:
                    // const tiff = await fromBlob(blobFile);
                    // const image = await tiff.getImage(); // by default, the first image is read.

                    // // Construct the WGS-84 forward and inverse affine matrices:
                    // const { ModelPixelScale: s, ModelTiepoint: t } =
                    //   image.fileDirectory;
                    // let [sx, sy, sz] = s;
                    // let [px, py, k, gx, gy, gz] = t;
                    // sy = -sy; // WGS-84 tiles have a "flipped" y component

                    // const pixelToGPS = [gx, sx, 0, gy, 0, sy];
                    // console.log(
                    //   `pixel to GPS transform matrix:`,
                    //   pixelToGPS
                    // );

                    // const gpsToPixel = [
                    //   -gx / sx,
                    //   1 / sx,
                    //   0,
                    //   -gy / sy,
                    //   0,
                    //   1 / sy,
                    // ];
                    // console.log(
                    //   `GPS to pixel transform matrix:`,
                    //   gpsToPixel
                    // );

                    // // Convert a GPS coordinate to a pixel coordinate in our tile:
                    // const [gx1, gy1, gx2, gy2, px1, py1, px2, py2] =
                    // image.getBoundingBox();

                    var solution = tif.split('base64,')[1];
                    const parseGeoraster = require('georaster');
                    let tifFile = this.dataURItoBlob(solution);

                    let imageBounds: any[] = [];
                    parseGeoraster(tifFile).then((georaster: any) => {
                      const min = georaster.mins[0];
                      const max = georaster.maxs[0];
                      const range = georaster.ranges[0];
                      let values: any = [];
                      let colors: any = [];
                      // get the legend values, and create legend
                      if (details.type === 'Rainfall') {
                        values = this.createLegendValues(
                          max,
                          min,
                          range,
                          'rain'
                        );
                        this.rainColors.forEach((color: any) => {
                          colors.push(color.color);
                        });
                      }
                      if (details.type === 'Min_Temperature') {
                        values = this.createLegendValues(
                          max,
                          min,
                          range,
                          'mintemp'
                        );
                        this.minTempColors.forEach((color: any) => {
                          colors.push(color.color);
                        });
                      }
                      if (details.type === 'Max_Temperature') {
                        values = this.createLegendValues(
                          max,
                          min,
                          range,
                          'maxtemp'
                        );
                        this.maxTempColors.forEach((color: any) => {
                          colors.push(color.color);
                        });
                      }

                      var scale = chroma.scale(colors).classes(values);

                      this.layer = new GeoRasterLayer({
                        georaster: georaster,
                        opacity: 0.7,
                        resolution: 256, // optional parameter for adjusting display resolution
                        pixelValuesToColorFn(pixelValues: number[]) {
                          // console.log( pixelValues[0] )
                          var pixelValue = pixelValues[0]; // there's just one band in this raster

                          // if there's zero value, don't return a color
                          if (pixelValue === 0) return '';
                          // scale to 0 - 1 used by chroma
                          // var scaledPixelValue = (pixelValue - min) / range;
                          var color = '';

                          if (details.type === 'Rainfall') {
                            if (pixelValue <= values[0]) {
                              color = scale(pixelValue).hex();
                            }
                            if (
                              pixelValue <= values[1] &&
                              pixelValue > values[0]
                            ) {
                              color = scale(pixelValue).hex();
                            }
                            if (
                              pixelValue <= values[2] &&
                              pixelValue > values[1]
                            ) {
                              color = scale(pixelValue).hex();
                            }
                            if (
                              pixelValue <= values[3] &&
                              pixelValue > values[2]
                            ) {
                              color = scale(pixelValue).hex();
                            }
                            if (
                              pixelValue <= values[4] &&
                              pixelValue > values[3]
                            ) {
                              color = scale(pixelValue).hex();
                            }
                            if (
                              pixelValue <= values[5] &&
                              pixelValue > values[4]
                            ) {
                              color = scale(pixelValue).hex();
                            }
                          } else {
                            if (pixelValue <= values[0]) {
                              color = scale(pixelValue).hex();
                            }
                            if (
                              pixelValue <= values[1] &&
                              pixelValue > values[0]
                            ) {
                              color = scale(pixelValue).hex();
                            }
                            if (
                              pixelValue <= values[2] &&
                              pixelValue > values[1]
                            ) {
                              color = scale(pixelValue).hex();
                            }
                            if (
                              pixelValue <= values[3] &&
                              pixelValue > values[2]
                            ) {
                              color = scale(pixelValue).hex();
                            }
                            if (
                              pixelValue <= values[4] &&
                              pixelValue > values[3]
                            ) {
                              color = scale(pixelValue).hex();
                            }
                          }
                          return color;
                        },
                      });

                      this.layer.addTo(this.map);
                      this.map.fitBounds(this.layer.getBounds());
                      this.loadingData = false;
                    });
                  });
              }
            });
        });
      });
  }

  public dataURItoBlob(dataURI: string) {
    const byteString = window.atob(dataURI);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const int8Array = new Uint8Array(arrayBuffer);
    // for (let i = 0; i < byteString.length; i++) {
    //   int8Array[i] = byteString.charCodeAt(i);
    // }
    // const blob = new Blob([int8Array], { type: 'image/tiff' });
    // return blob;

    for (var i = 0; i < byteString.length; i++) {
      int8Array[i] = byteString.charCodeAt(i);
    }
    return int8Array.buffer;
  }
  // end
  public csv2jso(str: any, delimiter = ',') {
    // let titles = str.slice(0, str.indexOf('\n')).split(delimiter);
    let rows = str.slice(str.indexOf('\n') + 1).split('\n');
    let _titles = <any>[];
    _titles.push('latitude');
    _titles.push('longitude');
    _titles.push('stationName');
    _titles.push('value');

    return rows.map((data: any) => {
      const values = data.split(delimiter);
      let _values = <any>[];
      _values.push(parseFloat(values[0]));
      _values.push(parseFloat(values[1]));
      _values.push(values[2]);
      _values.push(parseFloat(values[3]));
      return _titles.reduce(
        (object: any, curr: any, i: any) => (
          (object[curr] = _values[i]), object
        ),
        {}
      );
    });
  }

  onMapReady(map: any) {}

  onBaseLayerChange(map: any) {
    this.map = map;
    this.updateDistributionMapFile(this.currentData);
  }
}

// ${
//   station.measurementsAirWindDir.length > 0
//     ? station.measurementsAirWindDir[0][1]
//     : 0
// }

// <span class="bi bi-arrow-up" style="transform:rotate(${
//   station.measurementsAirWindDir.length > 0
//     ? station.measurementsAirWindDir[0][1]
//     : 0
// }deg);font-size:15px; display: block; font-size: 14px;"></span>&nbsp;

// &nbsp;${this.windDirectionText( (station.measurementsAirWindDir &&
//   station.measurementsAirWindDir.length > 0 ? station.measurementsAirWindDir[0][1] : 0) )}
// <br>
// <span class="bi bi-arrow-down" style="transform:rotate(${
//   station.measurementsAirWindDir &&
//   station.measurementsAirWindDir.length > 0
//     ? station.measurementsAirWindDir[0][1]
//     : 0
// }deg);font-size:15px; display: block; font-size: 14px; position: relative;" *ngIf="station.measurementsAirWindDir">
// </span>&nbsp;

// <span class="bi bi-arrow-down" style="transform:rotate(${
//   station.measurementsAirWindDir &&
//   station.measurementsAirWindDir.length > 0
//     ? station.measurementsAirWindDir[0][1]
//     : 0
// }deg);font-size:15px; display: block; font-size: 14px;" *ngIf="${station.measurementsAirWindDir || station.measurementsAirWindDir[0][1] !== null}">
// </span>
