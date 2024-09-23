//size of the response packet header:
let HEADER_SIZE = 12;

module.exports = {
  message: "", //Bitstream of the cPTP header
  payload: "", //Bitstream of the cPTP payload

  init: function (peerN, port, IP, imgTN, imgN) {
    let senderName = stringToBytes(peerN);

    //build the header bistream:
    //--------------------------
    this.message = new Buffer.alloc(HEADER_SIZE + senderName.length);
    this.payload = new Buffer.alloc(4 + imgN.length);

    //fill out the header array of byte with PTP header fields
    // V
    storeBitPacket(this.message, 7, 0, 4);

    // Message type
    storeBitPacket(this.message, 3, 4, 8);

    // Number of peers
    storeBitPacket(this.message, 0, 12, 8);

    // Sender name size
    storeBitPacket(this.message, senderName.length, 20, 12);

    // Sender name
    let j = 0;
    for (let i = 4; i < senderName.length; i++) {
      this.message[i] = senderName[j++];
    }

    let firstOctet = IP.split(".")[0];
    let secondOctet = IP.split(".")[1];
    let thirdOctet = IP.split(".")[2];
    let forthOctet = IP.split(".")[3];

    let bitMarker = 32 + 8 * senderName.length;

    storeBitPacket(this.message, firstOctet * 1, bitMarker, 8);
    bitMarker += 8;
    storeBitPacket(this.message, secondOctet, bitMarker, 8);
    bitMarker += 8;
    storeBitPacket(this.message, thirdOctet, bitMarker, 8);
    bitMarker += 8;
    storeBitPacket(this.message, forthOctet, bitMarker, 8);
    bitMarker += 8;
    storeBitPacket(this.message, port, bitMarker, 16);
    bitMarker += 16;

    if (imgTN == "BMP") {
      storeBitPacket(this.payload, 1, 0, 4);
    } else if (imgTN == "JPEG") {
      storeBitPacket(this.payload, 2, 0, 4);
    } else if (imgTN == "GIF") {
      storeBitPacket(this.payload, 3, 0, 4);
    } else if (imgTN == "PNG") {
      storeBitPacket(this.payload, 4, 0, 4);
    } else if (imgTN == "TIFF") {
      storeBitPacket(this.payload, 5, 0, 4);
    } else if (imgTN == "RAW") {
      storeBitPacket(this.payload, 15, 0, 4);
    }

    storeBitPacket(this.payload, imgN.length, 4, 28);

    let imgNameToBytes = stringToBytes(imgN);
    let k = 0;

    for (let i = 4; i < imgN.length + 4; i++) {
      this.payload[i] = imgNameToBytes[k++];
    }
  },

  //--------------------------
  //getbytepacket: returns the entire packet
  //--------------------------
  getBytePacket: function () {
    let packet = new Buffer.alloc(this.payload.length + HEADER_SIZE);
    //construct the packet = header + payload
    for (var Hi = 0; Hi < HEADER_SIZE; Hi++) packet[Hi] = this.message[Hi];
    for (var Pi = 0; Pi < this.payload.length; Pi++)
      packet[Pi + HEADER_SIZE] = this.payload[Pi];

    return packet;
  },
};

function stringToBytes(str) {
  var ch,
    st,
    re = [];
  for (var i = 0; i < str.length; i++) {
    ch = str.charCodeAt(i); // get char
    st = []; // set up "stack"
    do {
      st.push(ch & 0xff); // push byte to stack
      ch = ch >>> 8; // shift value down by 1 byte
    } while (ch);
    // add stack contents to result
    // done because chars have "wrong" endianness
    re = re.concat(st.reverse());
  }
  // return an array of bytes
  return re;
}

// Store integer value into the packet bit stream
function storeBitPacket(packet, value, offset, length) {
  // let us get the actual byte position of the offset
  let lastBitPosition = offset + length - 1;
  let number = value.toString(2);
  let j = number.length - 1;
  for (var i = 0; i < number.length; i++) {
    let bytePosition = Math.floor(lastBitPosition / 8);
    let bitPosition = 7 - (lastBitPosition % 8);
    if (number.charAt(j--) == "0") {
      packet[bytePosition] &= ~(1 << bitPosition);
    } else {
      packet[bytePosition] |= 1 << bitPosition;
    }
    lastBitPosition--;
  }
}
