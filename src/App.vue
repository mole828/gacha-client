<template>
  <button @click="client.ping()">ping</button><br/>
  <input type="text" v-model="noticeMsg" />
  <button @click="client.notice(this.noticeMsg)">notice</button><br/>

  <div>
    <select v-model="roomId">
      <option v-for="(room,i) in this.rooms" :key="i" :value="room.physicId">{{room.title}}</option>
    </select>
    <!-- <input type="text" v-model="roomId" /> -->
    <button @click="client.join(this.roomId)">join</button>
    <button @click="client.repos(this.roomId)">reposition</button>
    <br/>
    <button @click="client.leave()">leave</button>
    <button @click="client.history()">history</button>
    <br/>
    <button @click="client.seize()">seize</button><br/>
    <button @click="client.fire()">fire</button>
    <button @click="client.crit()">crit</button>
    <br>
    <button @click="client.machineBallPass(this.roomId) ">ballpass</button>
    <button @click="client.win(this.roomId, 'black')">win</button>
    <br/>
    <button @click="client.restart()">restart</button><br/>
    <button @click="client.cancel()">cancel</button><br/>
  </div>

  <div>
    <select v-model="oneId">
      <option v-for="(task,i) in this.oneps" :key="i" :value="task.onePieceTaskRecordId">{{task.title}}</option>
    </select>
    <!-- <input type="text" v-model="oneId" /> -->
    <button @click="client.joinLive(this.oneId)">join</button>
    <input v-model="buyCount" type="text">
    <button @click="client.buy(this.oneId, Number(this.buyCount))">buy</button>
  </div>
  
</template>
<style>
div {
  margin: 1em;
}
</style>
<script>
import { ref } from 'vue';
import io from 'socket.io-client';
import md5 from 'js-md5';
import axios from 'axios';
function mkEventId(){
  return Math.random().toString(36).slice(-8);
}
const headers = {
  appid: 'gacha',
  fakeuseragent: 'webview',
};
const token = '25c553de-a3fc-4e5e-bf1b-3daa26f9ca9d';
const p = '2404224c06e127c251d29e0d0c9d56159a5cbc19f6d60b4049dbb12c3961437932c6ff48359a17fcc1bbd4d542d12bdda28e21ab35c9614eaf483938260b3c70e088f95ffe7716580406c84038c9927a33a8f8d6bca8f41f49b3728983cb50f742e9097f6d8759d5ba693bba768e5fd86d8297e90d9b3936cbe3d9ea68713a90b57fe1067aae1624b830875a945928ba519f0c7eab61abe34ca0eb6ada8722bacc9c881ecc103a6782f2d8a4731a8f9d86bc051357a83a9f9c5785b4d7a0eb2dd06a1e24c41f377c7c5b7f4fea59fc671a544125ba426da458c68d71dd4fd6fafe38f6f8561b348491a2a17bfb7533a3cd5f1f7766174f5ca2d4354d7c93af98540432a890570dc508a36bb7fe6709388431899970c21866876f42cef17a7b5f533a97982c85de7502b367c31e0c3be7939503afdf607c918381f8dd2ffd71ac';

class GameClient {
  static async initRooms(callback){
    axios.post('/0/public/getMachineList', {
      p,
    }, {
      headers,
    }).then(res=>{
      res.data.data.machines.forEach(callback);
    })
  }

  static async initOnep(callback){
    await axios.post('/0/private/getOnePieceTaskRecordList', {
      token,
      p,
    }, {
      headers,
    }).then(res=>{
      res.data.data.recordList.forEach(callback);
    })
  }

  

  roomInfo;
  constructor(){
    const time = new Date().getTime();
    const str  = token+time+'kBK4XJ2BBF';
    const code = md5(str);
    this.socket = new io('/users', {
      query: {
        token,
        time,
        code,
      },
      header: {
        'Access-Control-Allow-Origin': '*',
        'content-type': 'application/json; charset=UTF-8',
        'fakeUserAgent': 'webview'
      },
      reconnection: false,
    });

    this.socket.on('connect',(e)=>{
      console.log('connect', e, );
    });

    this.socket.on('user-room-updated', (data)=>{
      console.log('on(user-room-updated)', data);
      const {realTimeInfo} = data;
      this.roomInfo = realTimeInfo;
    })

    this.socket.on('SG_STATUS', (data)=>{ // 私聊状态变化
      console.log('on(SG_STATUS)', data);
      this.sg = data;
    })

    this.socket.on("user-live-commenting", (data)=>{
      console.log('on(user-live-commenting)', data);
    });

    this.socket.on('onePieceRoomUpdate', (data)=>{
      console.log('on(onePieceRoomUpdate)', data);
    })
  }

  

  roomInfo;
  sg;

  roomId;
  join(roomId='K01'){
    const req = roomId
    this.socket.emit('user-join-room', req, (res)=>{
      // console.log('join', res);
      if(res.code===200){
        this.roomId = roomId;
      }
      console.log('user-join-room(', req, ')=>', res);
    })
  }
  leave(){
    const req = this.roomId
    this.socket.emit('user-leave-room', req, (res)=>{
      console.log('user-leave-room(', req, ')=>', res);
    } )
  }
  history() {
    const req = undefined;
    const event = 'user-get-lastRoom'
    this.socket.emit(event, (res)=>{
      console.log(event, `${req}=>`, res)
    })
  }
  seize(){
    const {status} = this.roomInfo;
    if( (status==='READY') ){
      const event='G_STRT';
      const eventId = mkEventId();
      const roomId= this.roomId;
      const req = {eventId, roomId, };
      this.socket.emit(event, req, (res)=>{
        console.log('seize(', req, ')=>', res);
      });
    } else {
      console.log('wrong status', this.roomInfo)
    }
  }
  
  fire(){
    const {roomInfo} = this;
    const {status, usedInfo} = roomInfo;
    if( status==='USED' && usedInfo.uid==='7474118' ){
      const {orderId} = this.sg;
      const roomId = this.roomId;
      const eventId = mkEventId();
      const req = {roomId, orderId, eventId}
      this.socket.emit('G_FIRE', req, (res)=>{
        console.log('G_FIRE(', req, ')=>', res );
      });
    }else {
      console.log('unable fire');
    }
  }
  crit(critMultiple=1){
    const {roomInfo} = this;
    const {status, usedInfo} = roomInfo;
    if(status==='USED' && usedInfo.uid==='7474118' ){
      const {orderId} = this.sg;
      const {roomId } = this;
      const eventId = mkEventId();
      const req = {orderId, roomId, eventId, critMultiple};
      this.socket.emit('G_CRIT', req, (res)=>{
        console.log('G_CRIT(', req, ')=>', res);
      })
    }
  }
  restart(){
    const {orderId} = this.sg;
    const roomId = this.roomId;
    const eventId = mkEventId();
    const req = { orderId, roomId, eventId, };
    this.socket.emit('G_RST', req, res=>{
      console.log('G_RST(', req, ')=>', res,);
    })
  }
  cancel() {
    const {orderId} = this.sg;
    const roomId = this.roomId;
    const eventId = mkEventId();
    const req = { 
      orderId, 
      roomId, 
      eventId, 
    }
    this.socket.emit('G_CXL', req, res=>{
      console.log('G_CXL(', req, ')=>', res);
    })
  }
  repos(roomId) {
    const req= {roomId}
    this.socket.emit('repos', req, res=>{
      console.log('repos(', req, ')=>', res, );
    })
  }

  ping() {
    const eventId = mkEventId()
    const ts = new Date().getTime();
    const req= {ts, eventId,}
    this.socket.emit('U_PING', req, (res)=>{
      console.log('U_PING(', req, ')=>', res)
    })
  }
  
  async notice(msg){
    const resp = await axios.post('/api/socket/users/broadcastNotice', {
      msg,
    });
    console.log('notice respond.data',resp.data);
  }

  /**
   * 
   * @param {string} roomId 
   * @param {*} order 
   */
  async machineBallPass(roomId) {
    const physicId = roomId.split('#')[0];
    const order = this.sg.orderId;
    console.log(physicId, order);
    const req = {
      physicId, order,
    };
    await axios.post('/api/socket/users/machineBallPass', req).then(resp=>{
      console.log('/api/socket/users/machineBallPass', req, '=>', resp.data);
    });
  }
  /**
   * 
   * @param {string} roomId 
   * @param {*} nfcId 
   */
  async win(roomId, nfcId){
    const physicId = roomId.split('#')[0];
    const order = this.sg.orderId;
    const req = {
      physicId,
      order,
      nfcId,
    }
    await axios.post("/api/socket/users/machineUpdateGameResult", req).then(resp=>{
      console.log("/api/socket/users/machineUpdateGameResult", req, '=>', resp.data);
    })
  }

  async buy(onePieceTaskRecordId, count=1,){
    axios.post('/0/private/buyOnePieceAward', {
      p,
      onePieceTaskRecordId,
      count,
    }, {
      headers,
    }).then(res=>{
      console.log(res);
    })
  }
  async joinLive(taskId,){
    const req = taskId;
    this.socket.emit('joinOnePieceRoom', req, ack=>{
      console.log('joinOnePieceRoom', req, '=>', ack,);
    });
  }
}

export default {
  name: 'App',
  components: {
  },
  setup(){
    const client = new GameClient();
    for(const _ in Array(20)){
      _;
      new GameClient();
    }
    const roomId = ref('');
    const rooms = ref([]);
    
    const reloadRoom = ()=>{
      const rms = rooms.value;
      while(rms.length)rms.pop();
      GameClient.initRooms((v)=>{
        rms.push(v);
        if(roomId.value==='')roomId.value=v.physicId;
      });
    };
    reloadRoom();

    const oneId = ref('');
    const oneps = ref([]);
    const reloadOnep= async ()=>{
      const ops = oneps.value;
      while(ops.length)ops.pop();
      const after = [];
      GameClient.initOnep((v)=>{
        if(v.totalCount===v.currentCount){
          after.push(v);
        }else{
          oneps.value.push(v);
        }
        if(oneId.value==='')oneId.value=v.onePieceTaskRecordId;
      }).then(()=>{
        oneps.value.push({title:'====='})
        // after.forEach(v=>oneps.value.push(v));
        oneps.value.push(...after);
      })
    }
    reloadOnep();

    const noticeMsg = ref('');
    
    return {
      client,
      noticeMsg,
      buyCount: ref(1),
      roomId,
      rooms,
      reloadRoom,
      oneId,
      oneps,
      reloadOnep,
    }
  }
}
</script>

