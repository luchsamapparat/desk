// @ts-check

const logElement = document.querySelector('#log');
const log = (message, writeToDocument = true) => {
    console.log(message);

    if (writeToDocument) {
        // @ts-ignore
        logElement.appendChild(document.createTextNode(`${message}\n`));
    }
};

/**
 * @type BluetoothDevice | undefined
 */
let device;

/**
 * @type BluetoothRemoteGATTServer | undefined
 */
let server;

/**
 * @type BluetoothRemoteGATTService | undefined
 */
let service;

document.querySelector('#connect')?.addEventListener('click', async () => {
    if (device == undefined) {
        device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: [0xff12] });
        log('✅ device selected');
        log(device, false);
    }

    server = await device.gatt?.connect();
    log('🔌 connected');
    log(server, false);
});

/** @type HTMLInputElement | null */
const heightInput = document.querySelector('#height');

document.querySelector('#height')?.addEventListener('change', () => changeDeskHeight(heightInput?.valueAsNumber));

document.querySelector('#disconnect')?.addEventListener('click', async () => {
    server?.disconnect();
    server = undefined;

    log('❌ disconnected');
});

const changeDeskHeight = async valueInCentimeter => {
    const headInBytes = [
        0x1b,
        0x02
    ];

    const valueInMillimeter = valueInCentimeter * 10;
    const valueInBytes = [(valueInMillimeter >> 8) & 0xff, valueInMillimeter & 0xff];

    const checksum = [...headInBytes, ...valueInBytes].reduce(
        (sum, value) => sum + value,
        0
    );

    const checksumInBytes = checksum & 0xff;

    const message = [
        ...headInBytes,
        ...valueInBytes,
        checksumInBytes,
        0x7e
    ]


    if (server == undefined) {
        log('🛑 no server found');
        return;
    }

    if (service == undefined) {
        service = await server.getPrimaryService(0xff12);
        log('🔍 retrieved primary service 0xff12');
        log(service, false);
    }

    const characteristic = await service.getCharacteristic(0xff01);
    log('🔍 retrieved characteristic 0xff01');
    log(characteristic, false);

    await characteristic.writeValueWithoutResponse(toBuffer('000000000000f1f1'));
    log('🖊️ write value 000000000000f1f1');

    await characteristic.writeValueWithoutResponse(new Uint8Array(message).buffer);
    log(`🖊️ write value ${message} (${valueInCentimeter} cm)`);
}

const toBuffer = string => new Uint8Array(string.match(/[\da-f]{2}/gi)?.map(value => parseInt(value, 16)) ?? []).buffer;