import { NgFor, NgIf } from '@angular/common';
import {
  Component,
  EventEmitter,
  Output,
  Input,
  SimpleChanges,
  NgModule,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { DropdownMenuComponent } from './dropdown-menu/dropdown-menu.component';
@Component({
  selector: 'app-leftmenu',
  templateUrl: './leftmenu.component.html',
  styleUrls: ['./leftmenu.component.css'],
  standalone: true,
  imports: [
    NgbAccordionModule,
    NgFor,
    NgIf,
    FormsModule,
    DropdownMenuComponent,
  ],
})
export class LeftmenuComponent {
  getActiveLastList: String = '';
  header: any;
  year: any = 'Current';
  months: any;
  baseTile: any;
  display: number = 1;
  file: string = '';
  @Input()
  directory!: any;

  @Output()
  update: EventEmitter<any> = new EventEmitter();
  @Output()
  remove: EventEmitter<any> = new EventEmitter();
  @Output()
  viewStreet: EventEmitter<any> = new EventEmitter();
  @Output()
  viewSat: EventEmitter<any> = new EventEmitter();
  @Output()
  setTempLayer: EventEmitter<any> = new EventEmitter();
  @Output()
  setRainForecast: EventEmitter<any> = new EventEmitter();
  @Output()
  removeGetAccumulationRainPrecipitation: EventEmitter<any> =
    new EventEmitter();
  @Output()
  changecurrentDataBreadCrumbs: EventEmitter<any> = new EventEmitter();

  view: string = 'Satellite View';
  layer: string = '';
  public handleView(e: any) {
    console.log(e.target.value);
    this.view = e.target.value;

    if (e.target.value === 'Satellite View') {
      this.viewSat.emit();
    } else {
      this.viewStreet.emit();
    }
  }

  removeTemplayer(value: string) {
    this.layer = '';
    this.setTempLayer.emit({ type: 'remove', kind: value });
  }

  getTempLayer = (e: any, type: string, kind: any, timeOfkind: any) => {
    // this.setTempLayer.emit({});
    // alert(type, kind);
    // alert(`${type} ${kind}`);

    if (e.target.checked) {
      this.layer = `${type}_${kind}`;
      this.layerRainfull = '';
      if (timeOfkind !== null) {
        if (timeOfkind === 'waiting') {
          window.scrollTo(0, e.clientY);
        } else {
          this.layerRainfull = `${type}_${timeOfkind.code}`;
          console.log(timeOfkind.name);
          let startDateTime = '';
          let endDateTime = '';
          if (timeOfkind.name.includes('Since')) {
            endDateTime = moment().format('x');
            startDateTime = moment().startOf('day').add(9, 'hours').format('x');
          } else {
            let splitTime = timeOfkind.name.split(' ');
            let time = splitTime[1] === 'Mins' ? 'Minutes' : 'Hours';
            endDateTime = moment().format('x');
            startDateTime = moment().subtract(time, splitTime[0]).format('x');
          } // uncomment here

          this.setRainForecast.emit({
            timeOfKind: timeOfkind.code,
            startDateTime,
            endDateTime,
          });
        }
      } else {
        this.setTempLayer.emit({ type, kind });
      }
    } else {
      if (timeOfkind !== null) {
        this.layerRainfull = '';
      } else {
        this.layer = '';
        this.layerRainfull = '';

        this.setTempLayer.emit({ type: 'remove', kind: type });
      }
    }
  };
  typeOfRainField: any = '';
  rainfieldGet = (e: any, r: any) => {
    if (this.typeOfRainField === r.code) {
      this.removeGetAccumulationRainPrecipitation.emit();
      this.typeOfRainField = '';
    } else {
      this.typeOfRainField = r.code;
      let startDateTime = '';
      let endDateTime = '';
      if (r.name.includes('Since')) {
        endDateTime = moment().format('x');
        startDateTime = moment().startOf('day').add(9, 'hours').format('x');
      } else {
        let splitTime = r.name.split(' ');
        let time = splitTime[1] === 'Mins' ? 'Minutes' : 'Hours';
        endDateTime = moment().format('x');
        startDateTime = moment().subtract(time, splitTime[0]).format('x');
      } // uncomment here

      this.setRainForecast.emit({
        timeOfKind: r.code,
        startDateTime,
        endDateTime,
      });
    }
  };
  updateDistributionMapData(iii: any, ii: number, i: string) {
    // this.getActiveLastList = iii;
    console.log(iii.target.value, ii, i);
    let giveUnderScore: string = '';
    let getUnderScoreForMainName: string = '';
    // for (let i = 0; i < iii.split(' ').length; i++) {
    //   giveUnderScore +=
    //     i !== iii.split(' ').length - 1
    //       ? `${iii.split(' ')[i]}_`
    //       : `${iii.split(' ')[i]}`;
    // }

    for (let ii = 0; ii < i.split(' ').length; ii++) {
      getUnderScoreForMainName +=
        ii !== i.split(' ').length - 1
          ? `${i.split(' ')[ii]}_`
          : `${i.split(' ')[ii]}`;
    }

    // let getMonth =giveUnderScore.includes("Annual")?false:  giveUnderScore.split("_")[0]
    // let yearMonth =!getMonth ?`${moment(`December ${ii}`,"MMMM-YYYY").format("YYYY-MM")} ${moment(`January ${ii}`,"MMMM-YYYY").format("YYYY-MM")}` : moment(`${getMonth} ${ii}`,"MMMM-YYYY").format("YYYY-MM")

    let checkIfMonth = iii.target.value.includes('Annual')
      ? false
      : iii.target.value;
    let startMonth = !checkIfMonth
      ? moment(`January ${ii}`, 'MMMM-YYYY').format('YYYY-MM')
      : moment(`${checkIfMonth} ${ii}`, 'MMMM-YYYY').format('YYYY-MM');
    let endMonth = !checkIfMonth
      ? moment(`December ${ii}`, 'MMMM-YYYY').format('YYYY-MM')
      : moment(`${checkIfMonth} ${ii}`, 'MMMM-YYYY').format('YYYY-MM');

    this.update.emit({
      type: getUnderScoreForMainName,
      year: ii,
      fileName: iii.target.value + '_' + i,
      format: 'png',
      startDate: startMonth,
      endDate: endMonth,
      groupByTime: !checkIfMonth ? 'yearly' : 'monthly',
    });
  }
  layerRainfull: any = '';
  navbarList = [
    {
      name: 'Max_Temperature',
      inside: [
        {
          name: 2023,
          inside: [
            { name: 'Annual' },
            { name: 'January' },
            { name: 'February' },
            { name: 'March' },
            { name: 'April' },
            { name: 'May' },
            { name: 'October' },
            { name: 'June' },
            { name: 'July' },
            { name: 'August' },
            { name: 'September' },
            { name: 'October' },
            { name: 'November' },
            { name: 'December' },
          ],
        },
        {
          name: 2022,
          inside: [
            { name: 'Annual' },
            { name: 'October' },
            { name: 'November' },
            { name: 'December' },
          ],
        },
      ],
    },
    {
      name: 'Min_Temperature',
      inside: [
        {
          name: 2023,
          inside: [
            { name: 'Annual' },
            { name: 'January' },
            { name: 'February' },
            { name: 'March' },
            { name: 'April' },
            { name: 'May' },
            { name: 'June' },
            { name: 'July' },
            { name: 'August' },
            { name: 'September' },
            { name: 'October' },
            { name: 'November' },
            { name: 'December' },
          ],
        },
        {
          name: 2022,
          inside: [
            { name: 'Annual' },
            { name: 'October' },
            { name: 'November' },
            { name: 'December' },
          ],
        },
      ],
    },
    {
      name: 'Rainfall',
      inside: [
        {
          name: 2023,
          inside: [
            { name: 'Annual' },
            { name: 'January' },
            { name: 'February' },
            { name: 'March' },
            { name: 'April' },
            { name: 'May' },
            { name: 'June' },
            { name: 'July' },
            { name: 'August' },
            { name: 'September' },
            { name: 'October' },
            { name: 'November' },
            { name: 'December' },
          ],
        },
        {
          name: 2022,
          inside: [
            { name: 'Annual' },
            { name: 'October' },
            { name: 'November' },
            { name: 'December' },
          ],
        },
      ],
    },
  ];

  toString(d: any) {
    return JSON.stringify(d);
  }
  rainfallForecast: any = [
    { name: '5 Mins', code: 'IDR310AR' },
    { name: '60 Mins', code: 'IDR310A1' },
    { name: 'Since 9 AM', code: 'IDR310A9' },
    { name: '24 Hours', code: 'IDR310AD' },
  ];
  private changeLeftMuneBar(val: any): void {
    if (val === undefined) return;
    this.navbarList = [];
    let t = val['children'];
    this.header = '';

    t.forEach((e: any) => {
      let inside: any = [];
      let temp = { name: e.name, inside: inside };
      let reverse = e.children;
      reverse.reverse();

      reverse.forEach((ee: any, i: number) => {
        if (i === 0) {
          this.year = ee.name.toString();
        }
        let inside: any = [];
        let ob: Object = { name: parseInt(ee.name), inside: inside };
        temp['inside'].push(ob);
        ee.children.forEach((ei: any) => {
          let name = this.removeNecessaryWords(ei.name);
          let r = temp['inside'][i]['inside'].find((x: any) => x.name === name);
          if (!r) {
            let ob: Object = { name: this.removeNecessaryWords(ei.name) };

            temp['inside'][i]['inside'].push(ob);
          }
        });
        let r = this.sortByMonthName(temp['inside'][i]['inside']);
      });
      // console.log(temp['inside']);
      this.navbarList.push(temp);
    });
    console.log(this.navbarList);
  }
  private sortByMonthName(monthNames: any) {
    const referenceMonthNames = [
      'january',
      'february',
      'march',
      'april',
      'may',
      'june',
      'july',
      'august',
      'september',
      'october',
      'november',
      'december',
    ];
    monthNames.sort((a: any, b: any) => {
      return (
        referenceMonthNames.indexOf(a.name.toLowerCase()) -
        referenceMonthNames.indexOf(b.name.toLowerCase())
      );
    });

    // return safeCopyMonthNames;
  }
  private removeNecessaryWords(i: any) {
    // let toReturn: string = '';
    // for (let ii = 0; ii < i.split('_').length; ii++) {
    //   toReturn +=
    //     ii !== i.split('_').length - 1
    //       ? `${i.split('_')[ii].replace()} `
    //       : `${i.split('_')[ii]}`;
    // }

    return i.split('_')[0];
  }
  removeUnderScore(i: string) {
    let toReturn: string = '';
    for (let ii = 0; ii < i.split('_').length; ii++) {
      toReturn +=
        ii !== i.split('_').length - 1
          ? `${i.split('_')[ii]} `
          : `${i.split('_')[ii]}`;
    }

    return toReturn.split('.')[0];
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.changeLeftMuneBar(this.directory);
  }
  ngOnInit() {
    this.changeLeftMuneBar(this.directory);
  }
  selected: any;
  public handleChanges(e: Event) {
    // console.log(e);
  }
  onChangeFile(e: any) {
    console.log(e);
    console.log(this.navbarList);
    if (e !== this.file) {
      this.file = e;

      if (this.header !== '' && this.year !== '') {
        this.updateDistributionMapData(
          { target: { value: e.split('_')[0] } },
          this.year,
          this.header
        );
      }
    } else {
      this.file = '';
      this.remove.emit();
    }
    this.changecurrentDataBreadCrumbs.emit([
      this.header,
      this.year,
      this.file.split('_')[0],
    ]);
  }
  fileName: any = '';
  onChangeYearSelect(e: any) {
    console.log(e);
    if (e !== this.year) {
      this.year = e;
      this.file = '';
      this.remove.emit();
      // if (this.header !== '' && this.file !== '') {
      //   // this.updateDistributionMapData(
      //   //   { target: { value: this.file } },
      //   //   e.target.value,
      //   //   this.header
      //   // );

      // }
    } else {
      this.year = '';
      this.remove.emit();
    }
    this.changecurrentDataBreadCrumbs.emit([this.header, e, this.file]);
  }
  public handleClick(e: any) {
    this.year = 2023;

    if (this.header === e.target.attributes.for.nodeValue) {
      this.header = '';
      // this.year = '';
      // this.file = '';

      this.remove.emit();
    } else {
      this.header = e.target.attributes.for.nodeValue;

      // if (this.file !== '') {
      //   this.file = '';
      // }

      // console.log(this.header);
      // console.log(this.navbarList);
      // let findType: any = this.navbarList.find((x) => x.name === this.header);
      // if (findType === undefined) alert('error');
      // let typeName = findType !== undefined ? findType.name : false;

      // let findYear = findType.inside.find(
      //   (x: any) => x.name.toString() === this.year.toString()
      // );
      // if (findYear === undefined) alert('error');
      // let year = findYear.name;
      // let findFile = findYear.inside;
      // let file = findYear.inside[0].name;

      // this.updateDistributionMapData(
      //   { target: { value: file } },
      //   year,
      //   typeName
      // );
      // console.log(typeName, year, file);
    }
    this.changecurrentDataBreadCrumbs.emit([
      this.header,
      this.year,
      this.file.split('_')[0],
    ]);
    // this.updateDistributionMapData()
    // let a = Object.keys(e.target.attributes).find((x: any) => {
    //   console.log(e.target.attributes[x]);
    //   return e.target.attributes[x].includes === 'for';
    // });

    // let a = e.target.attributes.find((x: any) => x === 'for');
  }
}
