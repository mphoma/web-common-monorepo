import React from 'react';
import { Messages } from "../constants";
import { postMessageToMiniProgram, removePendingMessage } from '../common';

/**
 * Hook to listen to accelerometer changes.
 * @return {{x: number, y: number, z: number}} The acceleration value in each axis.
 */

export const useAccelerometer = () => {

    const [
        acceleration,
        setAcceleration
    ] = React.useState({
        x: 0,
        y: 0,
        z: 0
    });

    React.useEffect(() => {

        const messageId =
            postMessageToMiniProgram(
                (Messages.onAccelerometerChange),
                (_error: any, acceleration: any) => {
                    // Note that the `onAccelerometerChange` doesn't generate any errors.
                    return setAcceleration(acceleration)
                },
                {
                    once: false,
                });

        return () => {

            removePendingMessage(messageId);

            postMessageToMiniProgram(
                Messages.offAccelerometerChange,
                () => { },
            );
        };
    }, []);

    return acceleration;

}