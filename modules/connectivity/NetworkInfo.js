import { getLogger } from 'jitsi-meet-logger';

import Listenable from '../util/Listenable';

export const NETWORK_INFO_EVENT = 'NETWORK_INFO_CHANGED';

const logger = getLogger(__filename);

/**
 * Module provides information about the current status of the internet
 * connection. Lib-jitsi-meet doesn't have any logic for detecting internet
 * online/offline, but rather it relies on the information supplied by the app
 * that uses it. By default the online state is assumed and the lib acts as if
 * it was connected. See {@link JitsiMeetJS.setNetworkInfo}.
 */
export class NetworkInfo extends Listenable {
    /**
     * Creates new {@link NetworkInfo} instance.
     */
    constructor() {
        super();
        this._current = {
            isOnline: true
        };

        this._lastUpdate = 0;
        this._stableStatusTimeout = null;
    }

    /**
     * Updates the network info state.
     * @param {boolean} isOnline - {@code true} if internet is online or {@code false} otherwise.
     */
    updateNetworkInfo({ isOnline }) {
        logger.debug('updateNetworkInfo', { isOnline });
        this._current = {
            isOnline: isOnline === true
        };

        this._lastUpdate = Date.now();

        this.eventEmitter.emit(NETWORK_INFO_EVENT, this._current);
    }

    /**
     * Return connection status when it stable and doesn't change for 5 seconds.
     * If status was changed in 5 second window, then wait until status is stable.
     * @returns {Promise<boolean>}
     */
    getStableStatus() {
        return new Promise(resolve => {
            logger.debug('getStableStatus');

            const prevStatusUpdate = this._lastUpdate;

            if (!this._stableStatusTimeout) {
                this._stableStatusTimeout = setTimeout(async () => {

                    this._stableStatusTimeout = null;

                    if (prevStatusUpdate === this._lastUpdate) {
                        resolve(this._current.isOnline);
                    } else {
                        resolve(await this.getStableStatus());
                    }
                }, 5000);
            }
        });
    }

    /**
     * Returns the online/offline internet status. By default the value is {@code true} and changes only if
     * the lib's user wires the state through {@link JitsiMeetJS.setNetworkInfo} like the jitsi-meet does. Because of
     * that any logic should still assume that the internet may be offline and should handle the failure gracefully.
     * It's only a good hint in the other way around: to pause internet operations until it comes back online.
     * @returns {boolean}
     */
    isOnline() {
        return this._current.isOnline === true;
    }
}

const networkInfo = new NetworkInfo();

export default networkInfo;
