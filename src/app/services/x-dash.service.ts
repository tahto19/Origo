import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs';
import { Station } from '../models/station';
import { User } from '../models/user';
import { Tenant } from '../models/tenant';
const API = "https://api.origo.farm/api/v1/";

@Injectable({
  providedIn: 'root'
})
export class XDashService {

constructor(private http: HttpClient) { }

login( api: string, user: string, pass: string ): Observable<User> {
  let body = {
    username: user,
    password: pass
  }

  return this.http.post<User>( api+'login', body );
}

getTenants( api: string, authKey: string, user: string ): Observable<Tenant[]> {
  let header = {
    headers: {
      "Authorization": "Bearer "+authKey
    }
  }

  return this.http.get<Tenant[]>( `${api}users/${user}/tenants`, header );
}

getStations( api: string, authKey: string, tenant: string ) {
  let header = {
    headers: {
      "Tenant": tenant,
      "Authorization": "Bearer "+authKey
    }
  }

  return this.http.get<Station[]>( `${api}stations/`, header );

}

getStationMeasurement( api: string, authKey: string, tenant: string, stationCode: string, startDateTime: any, endDateTime: any ) {
  let header = {
      "Tenant": tenant,
      "Authorization": "Bearer "+authKey
    }

  let params = new HttpParams()
  .set( 'startDateTime', startDateTime )
  .set( 'endDateTime', endDateTime )

  let options = {
    headers: header,
    params: params
  }

  return this.http.get( `${api}stations/${stationCode}/measurements`, options );
}

getStationMeasurementGroupByTime( api: string, authKey: string, tenant: string, stationCode: string, startDateTime: any, endDateTime: any, groupByTime: any ) {
  let header = {
      "Tenant": tenant,
      "Authorization": "Bearer "+authKey
    }

  let params = new HttpParams()
  .set( 'startDateTime', startDateTime )
  .set( 'endDateTime', endDateTime )

  let options = {
    headers: header,
    params: params
  }

  return this.http.get( `${api}stations/${stationCode}/${groupByTime}/measurements`, options );
}

getStation3hForeCast( api: string, authKey: string, lat: any, lon: any ) {

  return this.http.get( `${api}?lat=${lat}&lon=${lon}&appid=${authKey}&units=metric` );

}

getStationCurrentForeCast( api: string, authKey: string, lat: any, lon: any ) {

  return this.http.get( `${api}?lat=${lat}&lon=${lon}&appid=${authKey}&units=metric` );

}

getStationDailyForeCast( api: string, authKey: string, lat: any, lon: any ) {

  return this.http.get( `${api}?lat=${lat}&lon=${lon}&cnt=16&appid=${authKey}&units=metric` );

}

getDistributionMapDirectory( api: string, authKey: string, tenant: string ){
  let header = {
    headers: {
      "Tenant": tenant,
      "Authorization": "Bearer "+authKey
    }
  }

  return this.http.get<Station[]>( `${api}map/directory`, header );
}

getDistributionMapFile( api: string, authKey: string, tenant: string, type: string, year: number, fileName: string, format: string ){
  let header = {
    headers: {
      "Tenant": tenant,
      "Authorization": "Bearer "+authKey
    }
  }

  return this.http.get<Station[]>( `${api}map/file/${type}/${year}/${fileName}/${format}`, header );
}

getAccumulationRainPrecipitation( api: string, type: string ){
  // startDateTime: string, endDateTime: string
  return this.http.get( `${api}`, {
    params: {
      type: type,
      // startDateTime: startDateTime,
      // endDateTime: endDateTime,
    }
  } );
}

getRainFallColorPalette(url: any) {
  return this.http.get( url )
}


}
