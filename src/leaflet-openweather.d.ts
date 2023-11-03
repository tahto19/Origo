// Type definitions for leaflet-openweathermap
// By rwev <https://github.com/rwev>

import * as L from 'leaflet';

declare module 'leaflet' {

    namespace OWM {
        
        interface Clouds extends L.TileLayer {} 
        function clouds(options: any): Clouds;

        interface CloudsClassic extends L.TileLayer {} 
        function cloudsClassic(options: any): CloudsClassic;

        interface Precipitation extends L.TileLayer {} 
        function precipitation(options: any): Precipitation;

        interface PrecipitationClassic extends L.TileLayer {} 
        function precipitationClassic(options: any): PrecipitationClassic;

        interface Rain extends L.TileLayer {} 
        function rain(options: any): Rain;

        interface RainClassic extends L.TileLayer {} 
        function rainClassic(options: any): RainClassic;

        interface Snow extends L.TileLayer {} 
        function snow(options: any): Snow;

        interface Pressure extends L.TileLayer {} 
        function pressure(options: any): Pressure;

        interface PressureContour extends L.TileLayer {} 
        function pressureContour(options: any): PressureContour;

        interface Temperature extends L.TileLayer {} 
        function temperature(options: any): Temperature;

        interface Wind extends L.TileLayer {} 
        function wind(options: any): Wind;

    }
}