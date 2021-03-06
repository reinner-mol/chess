(function () {
    'use strict';

    function generateSearchParams() {
        const searchParams = new URLSearchParams();
        $('#dl-form')
            .find('input[name], select[name]')
            .each((_, e) => {
            const val = e.type === 'checkbox' ? e.checked.toString() : e.value;
            if (val && e.name)
                searchParams.append(e.name, val);
        });
        ['since', 'until'].forEach(name => {
            const minTimestamp = 1356998400070;
            const date = $(`#dl-date-${name}`).val();
            const time = $(`#dl-time-${name}`).val();
            if (date.length == 10) {
                // the 00:00:00 is necessary for the time to be interpreted in the local timezone
                const datetime = new Date(`${date} ${time.length == 8 ? time : '00:00:00'}`);
                // If no time is specified, assume that all games on that day should be included
                if (time.length != 8)
                    datetime.setDate(datetime.getDate() + 1);
                searchParams.append(name, Math.max(datetime.getTime(), minTimestamp).toString());
            }
        });
        const perfToggles = $('#dl-perfs input[type="checkbox"]');
        const perfTogglesChecked = perfToggles.filter(':checked').get();
        // don't add parameter if all or no perf types are selected
        if (perfTogglesChecked.length > 0 && perfTogglesChecked.length < perfToggles.length)
            searchParams.append('perfType', perfTogglesChecked.map(e => e.value).join(','));
        return searchParams.toString();
    }
    function update() {
        const params = generateSearchParams();
        const apiUrl = $('#dl-api-url');
        apiUrl.val(`${window.location.protocol}//${window.location.host}${apiUrl.data('apiPath')}?${params}`);
        const btn = $('#dl-button');
        btn.prop('href', btn.prop('href').split('?')[0] + '?' + params);
    }
    $('#dl-form').find('input, select').on('change', update);
    update();

}());
