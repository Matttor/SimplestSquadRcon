/* Simplest (within reason) Squad-Rcon Client with full failover
uncomment #packetBreaker() to test */

import * as net from "node:net";
import { Buffer } from "node:buffer";
import { EventEmitter } from "node:events";
export class RconConnection {
  constructor() {
    this.netConnection;
    this.connectionRetry = 5000;
    this.stream = new Buffer.alloc(0);
    this.responseString = "";
    this.type = { auth: 0x03, command: 0x02, response: 0x00, server: 0x01 };
    this.soh = { size: 7, id: 0, type: this.type.response, body: "" };
    this.events = new EventEmitter();
  }
  connect({ port, host, token }) {
    console.log("connecting");
    this.netConnection = net.createConnection({ port: port, host: host }, () => this.#write(this.type.auth, 2147483647, token));
    this.netConnection.on("data", (data) => this.#onData(data));
    this.netConnection.on("end", () => this.events.emit("end"));
  }
  send(body, id = 99) {
    this.#write(this.type.command, id, body);
    this.#write(this.type.command, id + 2);
  }
  #write(type, id, body) {
    this.netConnection.write(this.#encode(type, id, body).toString("binary"), "binary");
  }
  #encode(type, id, body = "") {
    const size = Buffer.byteLength(body) + 14;
    const buffer = new Buffer.alloc(size);
    buffer.writeInt32LE(size - 4, 0);
    buffer.writeInt32LE(id, 4);
    buffer.writeInt32LE(type, 8);
    buffer.write(body, 12, size - 2, "utf8");
    buffer.writeInt16LE(0, size - 2);
    return buffer;
  }
  #onData(data) {
    //this.#packetBreaker(data);
    this.stream = Buffer.concat([this.stream, data], this.stream.byteLength + data.byteLength);
    while (this.stream.byteLength >= 7) {
      const packet = this.#decode();
      if (!packet) break;
      else if (packet.type === this.type.response) this.#onResponse(packet);
      else if (packet.type === this.type.server) this.events.emit("server", packet.body);
      else if (packet.type === this.type.command) this.events.emit("auth");
    }
  }
  #decode() {
    if (this.stream[0] === 0 && this.stream[1] === 1 && this.stream[2] === 0 && this.stream[3] === 0 && this.stream[4] === 0 && this.stream[5] === 0 && this.stream[6] === 0) {
      this.stream = this.stream.subarray(7);
      return this.soh;
    }
    const bufSize = this.stream.readInt32LE(0);
    if (bufSize > 4096 || bufSize < 10) return this.#badPacket();
    else if (bufSize <= this.stream.byteLength - 4) {
      const bufId = this.stream.readInt32LE(4);
      const bufType = this.stream.readInt32LE(8);
      if ( this.stream[bufSize + 2] !== 0 || this.stream[bufSize + 3] !== 0 || bufId < 0 || bufType < 0 || bufType > 3 ) return this.#badPacket();
      else {
        const response = { size: bufSize, id: bufId, type: bufType, body: this.stream.toString("utf8", 12, bufSize + 2) };
        this.stream = this.stream.subarray(bufSize + 4);
        return response;
      }
    } else return null;
  }
  #onResponse(packet) {
    if (packet.body === "") {
      this.events.emit("response", this.responseString);
      this.responseString = "";
    } else if (!packet.body.includes("")) {
      this.responseString = this.responseString += packet.body;
    } else this.#badPacket();
  }
  #badPacket() {
    this.stream = Buffer.alloc(0);
    this.responseString = "";
    console.log("Bad Packet!");
    return null;
  }
  // #packetBreaker(data) {
  //   const trigger = Math.floor(Math.random() * 3);
  //   if (trigger < 2) {
  //     console.warn("SMASH!");
  //     const max = data.byteLength;
  //     const random = Math.floor(Math.random() * max);
  //     data.copy(data, random);
  //   }
  // }
}

const squadRcon = () => {
    const serverCredentials = { port: "0", host: "0.0.0.0", token: "password" };
    const rcon = new RconConnection();
    rcon.connect(serverCredentials);
    rcon.retry = setInterval(() => {
      rcon.connect(serverCredentials);
    }, rcon.connectionRetry);
    rcon.events.on("server", (str) => console.warn(str));
    rcon.events.on("response", (str) => console.log(str));
    rcon.events.on("auth", () => {
      console.log("Rcon Authed");
      clearInterval(rcon.retry);
      rcon.send("ListLayers");
      rcon.interval = setInterval(() => {
        rcon.send("ShowCurrentMap");
        rcon.send("ListPlayers");
        rcon.send("ListSquads");
        rcon.send("ShowNextMap");
      }, 5000);
    });
    rcon.events.on("end", () => clearInterval(rcon.interval));
  };
  squadRcon();