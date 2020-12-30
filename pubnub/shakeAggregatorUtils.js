(function(exports){

    function shakePublishValues(team,playerId,period,shakePower,total,sendTotal) {
        const values = [
            {
                key: team,
                id: playerId,
                value: shakePower
            }
        ];
        if (period) {
            const teamPeriod = team+"p"+period.toString().padStart(2,'0') ;
            values.push(
                {
                    key: teamPeriod,
                    id: playerId,
                    value: shakePower
                },
            );
        }
        if (sendTotal) {
            values.push(
                {
                    key: team + "total",
                    id: playerId,
                    value: total
                }
            );
        }
        return values ;
    }

    exports.shakePublishValues = shakePublishValues ;

})(typeof exports === 'undefined'? this['shakeAggregatorUtils']={}: exports);
