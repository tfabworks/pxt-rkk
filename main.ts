enum DARK_BRIGHT {
    //% block="暗い"
    IS_DARK,
    //% block="明るい"
    IS_BRIGHT,
}

enum HOT_COLD {
    //% block="熱い"
    HOT,
    //% block="冷たい"
    COLD,
}


//% weight=70 icon="\uf0e7" color=#d2691e block="電気の利用"
namespace rkk {
    /**
     * 人感センサーが反応しているとき真を返します。
     */
    //% blockId=is_man_moving block="人が動いた"
    //% weight=100
    export function is_man_moving(): boolean {
        if (pins.digitalReadPin(DigitalPin.P2) == 1) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * 自動スイッチをONします。
     */
    //% blockId=turn_on block="スイッチON"
    //% weight=90
    export function turn_on(): void {
            pins.digitalWritePin(DigitalPin.P1, 1);
    }

    /**
     * 自動スイッチをOFFします。
     */
    //% blockId=turn_off block="スイッチOFF"
    //% weight=80
    export function turn_off(): void {
        pins.digitalWritePin(DigitalPin.P1, 0);
    }



    let _今まで暗い: boolean = false;
    const _暗い判定閾値: number = 20;
    const _明るい判定閾値: number = 25;
    const _HYSTERESIS: number = _明るい判定閾値 - _暗い判定閾値;

    /**
     * micro:bit本体の明るさセンサーが暗い場合（20未満）に真を返します。
     */
    //% blockId=is_dark block="暗い"
    //% weight=70
    export function is_dark(): boolean {
        return _is_dark(_暗い判定閾値, _明るい判定閾値);

    }

    /* 明るさの平均を取る */
    function _lightLevelSampling(): number {
        const CYCLE_SAMPLE_NUM: number = 50
        let accum明るさ: number = 0;
        for (let i = 0; i < CYCLE_SAMPLE_NUM; i++) {
            accum明るさ += input.lightLevel();
            basic.pause(1);
        }
        let 明るさ = accum明るさ / CYCLE_SAMPLE_NUM;
        return 明るさ;
    }

    /* 暗い判定本体 */
    function _is_dark(暗い判定閾値: number, 明るい判定閾値: number): boolean {
        if ((暗い判定閾値 > 明るい判定閾値)
            || (暗い判定閾値 < 0)
            || (暗い判定閾値 > 255)
            || (明るい判定閾値 < 0)
            || (明るい判定閾値 > 255)) {
            control.assert(false, "threshold is abnormal");
        }

        let 現在の明るさ = _lightLevelSampling();

        const 暗い: boolean = true;
        const 明るい: boolean = false;

        if (_今まで暗い) { //現在まで暗い環境だったとき。明るいかを判定
            if (現在の明るさ > 明るい判定閾値) {
                _今まで暗い = 明るい;
                return 明るい; //現在は明るい
            }
            else {
                _今まで暗い = 暗い;
                return 暗い; //現在は暗い
            }
        }
        else { // 現在まで明るい環境だったとき。暗いかを判定
            if (現在の明るさ < 暗い判定閾値) {
                _今まで暗い = 暗い;
                return 暗い; //現在は暗い
            }
            else {
                _今まで暗い = 明るい;
                return 明るい; //現在は明るい
            }
        }
        control.assert(false);
    }

    /**
     * micro:bit本体の明るさセンサーがしきい値より暗い（または明るい）場合に真を返します。
     * @param light_threshold 判定閾値, eg:15
     * @param dark_bright 暗いか明るいを指定, eg:暗い
     */
    //% blockId=gt_light_level
    //% block="%light_threshold|より%dark_bright|"
    //% light_threshold.min=0 light_threshold.max=255
    //% weight=60
    export function gt_light_level(light_threshold: number, dark_bright: DARK_BRIGHT): boolean {
        if (_HYSTERESIS < 0) { control.assert(false); }
        if (light_threshold < 0) {
            light_threshold = 0;
        }
        if (light_threshold > 255) {
            light_threshold = 255;
        }

        if (dark_bright === DARK_BRIGHT.IS_DARK) {
            let 暗い判定閾値: number = light_threshold;
            let 明るい判定閾値: number = light_threshold + _HYSTERESIS;
            if (明るい判定閾値 > 255) { 明るい判定閾値 = 255; }
            return _is_dark(暗い判定閾値, 明るい判定閾値);
        }
        else if (dark_bright === DARK_BRIGHT.IS_BRIGHT) {
            let 暗い判定閾値: number = light_threshold - _HYSTERESIS;
            let 明るい判定閾値: number = light_threshold;
            if (暗い判定閾値 < 0) { 暗い判定閾値 = 0; }
            return !_is_dark(暗い判定閾値, 明るい判定閾値);
        }
        control.assert(false); return false;
    }

    /**
     * micro:bit本体の温度センサーが、しきい値より熱い（または冷たい）場合に真を返します。
     * @param temperatureThreshold 判定閾値, eg: 30
     * @param settingHotCold 熱いか冷たいを指定, eg:熱い
     */
    //% blockId=gt_temperature
    //% block="%temperatureThreshold|℃より%settingHotOrCold|"
    //% weight=50
    export function gt_temperature(temperatureThreshold: number, settingHotCold: HOT_COLD): boolean {
        if (settingHotCold === HOT_COLD.HOT) {
            if (input.temperature() > temperatureThreshold) {
                return true;
            }
            return false;
        }
        if (settingHotCold === HOT_COLD.COLD) {
            if (input.temperature() < temperatureThreshold) {
                return true;
            }
            return false;
        }
        return false;
    }
    
    /**
     * micro:bit本体が揺り動かされた場合に真を返します。
     */
    //% blockId=is_move
    //% block="ゆれた"
    //% weight=40
    export function is_move() : boolean {
        let current_acc = input.acceleration(Dimension.Strength)
        if ( current_acc < 750 || 1650 < current_acc ) {
            return true;
        }
        return false;
    }

    /**
     * 指定された秒数の間、一時停止します。
     * @param sec 秒, eg: 1
     */
    //% blockId=pause_sec
    //% block="一時停止（秒）%sec"
    //% weight=30
    export function pause_sec( sec:number ) {
        basic.pause(1000*sec);
    }

    function getAnalogValue(p: AnalogPin): number {
        let arr: number[] = [];
        // Median filter
        for (; ;) {
            let val: number;
            // To prevent 255 from suddenly being measured
            // when using analog and LED at the same time
            if ((val = pins.analogReadPin(p)) != 255)
                arr.push(val);
            if (arr.length == 3)
                break;
        }
        arr.sort((n1, n2) => n1 - n2);
        return arr[1];
    }
    
    /**
     * 現在の蓄電量をバーグラフに表示します。
     */
    //% blockId=plot_bar_graph_charge block="蓄電量を表示"
    //% weight=20
    export function plotBarGraphCharge() {
        led.plotBarGraph(
            getAnalogValue(AnalogPin.P0),
            1023
        )
    }
}
