/* Simple Rcon Client by Mattt */
import * as net from "node:net";
import { Buffer } from "node:buffer";
import { EventEmitter } from "node:events";
class RconConnection {
  constructor() {
    this.events = new EventEmitter();
    this.netConnection;
    this.stream = new Buffer.alloc(0);
    this.responseString = "";
    this.type = { auth: 0x03, command: 0x02, response: 0x00, server: 0x01 };
    this.soh = { size: 7, id: 0, type: this.type.response, body: "" };
  }
  connect({ port, host, token }) {
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
    this.stream = Buffer.concat([this.stream, data], this.stream.byteLength + data.byteLength);
    while (this.stream.byteLength >= 4) {
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
    if (bufSize <= this.stream.byteLength - 4) {
      const response = { size: bufSize, id: this.stream.readInt32LE(4), type: this.stream.readInt32LE(8), body: this.stream.toString("utf8", 12, bufSize + 2) };
      this.stream = this.stream.subarray(bufSize + 4);
      return response;
    } else return null;
  }
  #onResponse(packet) {
    if (packet.body !== "") this.responseString = this.responseString += packet.body;
    else {
      this.events.emit("response", this.responseString);
      this.responseString = "";
    }
  }
}

const squadRcon = () => {
  const rcon = new RconConnection();
  rcon.connect({ port: "0", host: "0.0.0.0", token: "password" });
  rcon.events.on("server", (str) => console.warn(str));
  rcon.events.on("response", (str) => console.log(str));
  rcon.events.on("auth", () => {
    rcon.send("ListLayers");
    rcon.interval = setInterval(() => {
      rcon.send("ShowCurrentMap");
      rcon.send("ListPlayers");
      rcon.send("ListSquads");
      rcon.send("ShowNextMap");
    }, 60000);
  });
  rcon.events.on("end", () => clearInterval(rcon.interval));
};
squadRcon();
