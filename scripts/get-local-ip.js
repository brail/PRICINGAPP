#!/usr/bin/env node

const { networkInterfaces } = require("os");

function getLocalIP() {
  const interfaces = networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }

  return "localhost";
}

console.log(getLocalIP());
