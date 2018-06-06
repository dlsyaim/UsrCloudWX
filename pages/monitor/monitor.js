var usrCloud = require('../../utils/usrCloudWx');
var md5util = require('../../utils/md5.js');

var eqID=[]; //设备ID;
var eqData=[]; //设备数据
var eqTime=[]; //设备最后一次上传时间

var tt;

var client;
//用户信息
var token;
var useraccount;
var password;
Page({
  data: {
    devicesInfoList: [], //放置返回数据的数组  
    isFromSearch: true,   // 用于判断searchSongList数组是不是空数组，默认true，空的数组  
    searchPageNum: 15,   // 设置加载的第几次，默认是第一次  
    callbackcount: 0,      //返回数据的个数  
    searchLoading: false, //"上拉加载"的变量，默认false，隐藏  
    searchLoadingComplete: false  //“没有数据”的变量，默认false，隐藏  
  },
  reConnect: function (test) {
    client = new usrCloud();
    client.Usr_Init('clouddata.usr.cn', 443, 2, callback);
    client.USR_Connect(useraccount, password);
 },
  onLoad: function (option) {
    this.setData({
      searchPageNum: 20,   //第一次加载，设置20 
      devicesInfoList: [],  //放置返回数据的数组,设为空  
      isFromSearch: true,  //第一次加载，设置true  
      searchLoading: true,  //把"上拉加载"的变量设为true，显示  
      searchLoadingComplete: false, //把“没有数据”设为false，隐藏  
    })

    //获取缓存中用户数据 同步的
    try {
      token = wx.getStorageSync('userinfo').data.token;
      useraccount = wx.getStorageSync('userinfo').data.account;
      password = wx.getStorageSync('userpass');
    } catch (e) {
      console.log('获取缓存失败' + e);
      wx.showToast({
        title: '获取缓存失败',
        icon: 'loading',
        duration: 2000
      });
      wx.reLaunch({
        url: '/pages/login/login'
      });
      return;
    }

    // this.openWebSocketConnect();
  },


  /**
 * 如果设备在线就开始websocket连接 否则只显示历史数据
 */
  openWebSocketConnect: function () {
    console.log("进入");
    var that = this;
    // wx.showLoading({
    //   title: '连接Socket中',
    // });

    function USR_onConnAck(e) {
      if (e.code === 0) {

        clearInterval(tt);  //删除定时器

        wx.hideLoading();
        //client.USR_SubscribeDevParsed(devid);
        //console.log(devid);
       // client.USR_SubscribeDevRaw(devid);
        console.log(useraccount);

        
        setTimeout(function () {
          //client.USR_SubscribeUserParsed(useraccount);
          client.USR_SubscribeUserRaw(useraccount);
        }, 100);
      }
      console.log('USR_onConnAck', e);
    }

    function USR_onConnLost(e) {
      console.log('连接丢失');

      console.log('USR_onConnLost', e);
      //client.USR_Connect(useraccount, password);
      //client.openWebSocketConnect();



    //   tt = setInterval(function () {
    //   //client.USR_SubscribeUserParsed(useraccount);
    //     client = new usrCloud();
    //     client.Usr_Init('clouddata.usr.cn', 443, 2, callback);
    //     client.USR_Connect(useraccount, password);
    // }, 10000);
 
    }

    function USR_onRcvParsedDataPointPush(e) {
      var dataInfoList = that.data.dataInfoList;
      var dataPoints = e.dataPoints;
      for (var key in dataPoints) {
        var dataPoint = dataPoints[key];
        var dataInfoList = that.data.dataInfoList;
        for (var key in dataInfoList) {
          if (dataInfoList[key].id == dataPoint.pointId && dataInfoList[key].slaveIndex == dataPoint.slaveIndex) {
            dataInfoList[key].value = dataPoint.value;
            dataInfoList[key].createTime = that.getTime(new Date().getTime() / 1000, 'y-M-d h:m');
          }
        }
      }
      that.setData({ dataInfoList: dataInfoList });
      console.log('USR_onRcvParsedDataPointPush', e);
    }

    function USR_onSubscribeAck(e) {
      console.log('USR_onSubscribeAck', e);
    }

    function USR_onUnSubscribeAck(e) {
      console.log('USR_onUnSubscribeAck', e);
    }

    function USR_onRcvParsedDevStatusPush(e) {
      that.setData({
        status: e.status
      });
      console.log('USR_onRcvParsedDevStatusPush', e);
    }

    function USR_onRcvParsedDevAlarmPush(e) {
      console.log('USR_onRcvParsedDevAlarmPush', e);
    }

    function USR_onRcvRawFromDev(e) {
      var that = this;
      console.log(e.devId);
      console.log(e.payload);

      var s = '';
      for (var i = 0; i < e.payload.length; i++) { s = s + e.payload[i].toString(16) + ','; }

      eqID=[];
      eqData=[];
      eqTime=[];
      eqID.push(e.devId.toString());
      eqData.push(s);

      var now = new Date();
      var year = "" + now.getFullYear();
      var month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
      var day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
      var hour = "" + now.getHours(); if (hour.length == 1) { hour = "0" + hour; }
      var minute = "" + now.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
      var second = "" + now.getSeconds(); if (second.length == 1) { second = "0" + second; }
      var date_format_str= year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
      console.log(date_format_str);
      //var time = that.getTime(new Date().getTime() / 1000, 'y-M-d h:m');
      eqTime.push(date_format_str);
  
      if (!wx.getStorageSync('eqID')) {
        console.log('缓存中没有数据');
        wx.setStorageSync('eqID', eqID);
        wx.setStorageSync('eqData', eqData);
        wx.setStorageSync('eqTime', eqTime);
      } else {
        eqID = wx.getStorageSync('eqID');
        eqData = wx.getStorageSync('eqData');
        eqTime = wx.getStorageSync('eqTime');
      }

      var devIDStr = e.devId.toString();

      var bFlag = 0; //标识位
      for(var i = 0; i<eqID.length; i++){
        if (devIDStr==eqID[i]){
          eqData[i] = s;
          eqTime[i] = date_format_str;
          bFlag = 1;
          break;
        }
      }

      if(bFlag == 0){
        eqID.push(e.devId);
        eqData.push(s);
        eqTime.push(date_format_str);
      }

    //插入缓存
      wx.setStorageSync('eqID', eqID);
      wx.setStorageSync('eqData', eqData);
      wx.setStorageSync('eqTime', eqTime);
    }

    let callback = {
      USR_onConnAck: USR_onConnAck,
      USR_onConnLost: USR_onConnLost,
      USR_onRcvParsedDataPointPush: USR_onRcvParsedDataPointPush,
      USR_onSubscribeAck: USR_onSubscribeAck,
      USR_onUnSubscribeAck: USR_onUnSubscribeAck,
      USR_onRcvParsedDevStatusPush: USR_onRcvParsedDevStatusPush,
      USR_onRcvParsedDevAlarmPush: USR_onRcvParsedDevAlarmPush,
      USR_onRcvRawFromDev: USR_onRcvRawFromDev
    };
    client = new usrCloud();
    client.Usr_Init('clouddata.usr.cn', 443, 2, callback);
  },

  // 点击获取设备下的数据点
  onClickDeviceInfo: function (event) {
    var that = this;
    var devicesInfoList = that.data.devicesInfoList;
    var devid = event.currentTarget.dataset.devid;
    for (var key in devicesInfoList) {
      if (devicesInfoList[key].devid == devid) {
        var devicesInfo = devicesInfoList[key];
      }
    }

    
    //client.USR_PublishRawToDev(devid, [0x5a]);

    wx.navigateTo({
      url: '/pages/monitor/monitordata/monitordata?devicesInfo=' + JSON.stringify(devicesInfo),
    })
  },
  //搜索，访问网络  
  fetchSearchList: function () {
    var that = this;
    let searchPageNum = that.data.searchPageNum,//把第几次加载次数作为参数  
      callbackcount = that.data.callbackcount; //返回数据的个数  
    //获取缓存中用户数据

    wx.getStorage({
      key: 'userinfo',
      success: function (res) {
        var userinfo = (res.data.data);
        that.setData({ userinfo: userinfo });
        if (userinfo.token.length != 0) {
          wx.request({
            url: 'https://cloudapi.usr.cn/usrCloud/dev/getDevs',
            method: 'POST',
            data: {
              property_needed: [
                "name",
                "onlineStatus",
                "pass"
              ],
              page_param: {
                offset: 0,
                limit: searchPageNum
              },
              sort: 'up',
              token: userinfo.token
            },
            success: function (res) {
              var devicesinfo = res.data.data;

              that.setData({ devicesinfo: devicesinfo });

              //判断是否有数据，有则取数据  
              if (devicesinfo.total != 0) {
                if (devicesinfo.total > devicesinfo.dev.length) {
                  var issearchLoading = true;
                } else {
                  var issearchLoading = false;
                }
                that.setData({
                  devicesInfoList: devicesinfo.dev, //获取数据数组  
                  searchLoading: issearchLoading   //把"上拉加载"的变量设为false，显示 
                });
              } else {
                //没有数据了，把“没有数据”显示，把“上拉加载”隐藏  
                that.setData({
                  searchLoadingComplete: true, //把“没有数据”设为true，显示  
                  searchLoading: false  //把"上拉加载"的变量设为false，隐藏  
                });
              }
             // client.USR_Connect(useraccount, password);

            },

          })
        }

      },
    })


  },
  onClickDataInfo: function (event) {
    var menuid = event.currentTarget.dataset.dataid;

  },
  //滚动到底部触发事件  
  searchScrollLower: function () {
    let that = this;
    if (this.data.devicesInfoList.length < this.data.devicesinfo.total) {
      if (that.data.searchLoading && !that.data.searchLoadingComplete) {
        that.setData({
          searchPageNum: that.data.searchPageNum + 20,  //每次触发上拉事件，把searchPageNum+1  
          isFromSearch: false  //触发到上拉事件，把isFromSearch设为为false  
        });
        that.fetchSearchList();
      }
    } else {
      that.setData({
        searchLoadingComplete: true, //把“没有数据”设为true，显示  
        searchLoading: false  //把"上拉加载"的变量设为false，隐藏  
      });
    }
  }
  , onShow: function () {
    this.fetchSearchList();
  },
  /**
 * 转换时间格式
 */
  getTime: function (time, format) {
    var date = new Date(time * 1000);
    if (format === undefined) {
      format = date;
      date = new Date();
    }
    var map = {
      "y": date.getFullYear(),//年
      "M": date.getMonth() + 1, //月份
      "d": date.getDate(), //日
      "h": date.getHours(), //小时
      "m": date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes(), //分
      "s": date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds(), //秒
      "q": Math.floor((date.getMonth() + 3) / 3), //季度
      "S": date.getMilliseconds() //毫秒
    };
    format = format.replace(/([yMdhmsqS])+/g, function (all, t) {
      var v = map[t];
      if (v !== undefined) {
        if (all.length > 1) {
          v = '0' + v;
          v = v.substr(v.length - 2);
        }
        return v;
      }
      return all;
    });
    return format;
  }
})  
