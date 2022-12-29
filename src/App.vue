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
    <button @click="client.loopOn()">loopOn</button>
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
const token = '2590ab9c-80e3-48eb-b713-75c205106e67';
const p = 'af36a8754d9a9f8a0622a81fb88d733274b6ca04ad748170b6c26ef88b56d790f1836134d1da27edc84894ab8fb0401d76bd8482adf21f1c56861b0843eaef7e0676e3dfa803a6efcb66e96bd9fac0fb5723a67168760687f7a8340846d77d088755997f609822befc9a89933f1e423e16b3808d7f8af8161dbb90752fdc440b5435b90617e89e088a710785016919593c45659d6afca8b37be1e3bb85c99c91d6d5c17188d092a13985f6cdb9f865b8a27b367472e4c537ba693bba768e5fd87aef151e7b5a651eeed0cd4cb03d1024f99a9346596590f8cc9c881ecc103a67f276b10f8215dbed90e740dc6f951cd9c4f2352808f55ff8374cdf4138a75f9b51c3c4b8f68d1f7dd8c64e3c72385ba2b864307abb234cf7a24d7104d94477abaa8257a2d126c772d4360ec4dcb58fcdbae48cd1f3182b0ad9c95639ba9601db';

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

  beforeUpdate = ()=>{}

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
      this.beforeUpdate(realTimeInfo.status)
    })

    this.socket.on('SG_STATUS', (data)=>{ // 私聊状态变化
      console.log('on(SG_STATUS)', data);
      this.sg = data;
      this.beforeUpdate(data.gameStatus);
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
  loopOn() {
    console.log('hooked')
    let winCounter = 0;
    this.beforeUpdate = (status) => {
      console.log('beforeUpdate')
      console.log(status)
      if(status==="READY"){
        setTimeout(()=>{
          this.seize()
          setTimeout(()=>{
            this.fire()
          }, 500)
        }, 300)
      } 
      if(status==="WIN") {
        winCounter += 1;
        console.log( {winCounter} );
        setTimeout(()=>{
          this.cancel()
        },400)
      }
      
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

