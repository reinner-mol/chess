(function () {
    'use strict';

    function rate (select) {
        const max = 5, $select = $(select), $rate = $('<rate-stars>').addClass('rate-active').insertAfter(select), getValue = () => parseInt($select.val()), $stars = Array(max)
            .fill(0)
            .map((_, i) => $('<star>')
            .data('v', i + 1)
            .appendTo($rate)), setClasses = () => requestAnimationFrame(() => {
            const v = hovered || getValue();
            $stars.map(($star, i) => $star.toggleClass('rate-selected', i <= v - 1));
        });
        let hovered = 0;
        setClasses();
        $rate
            .on('mouseenter', 'star', function () {
            hovered = parseInt(this.getAttribute('data-v'));
            setClasses();
        })
            .on('mouseleave', 'star', function () {
            hovered = 0;
            setClasses();
        })
            .on('click', 'star', function () {
            $select.val(this.getAttribute('data-v'));
            setClasses();
        });
    }

    lichess.load.then(() => {
        $('.coach-review-form .toggle').on('click', function () {
            $(this).remove();
            $('.coach-review-form form').show();
            $('select.rate').each(function () {
                rate(this);
            });
        });
    });

}());
