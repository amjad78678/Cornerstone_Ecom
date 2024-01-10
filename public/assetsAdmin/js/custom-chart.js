(function ($) {


    if ($('#myChart').length) {
        var ctx1 = document.getElementById('myChart').getContext('2d');

        let jan = document.getElementById('jan').value
        let feb = document.getElementById('feb').value
        let mar = document.getElementById('mar').value
        let apr = document.getElementById('apr').value
        let may = document.getElementById('may').value
        let jun = document.getElementById('jun').value
        let jul = document.getElementById('jul').value
        let aug = document.getElementById('aug').value
        let sep = document.getElementById('sep').value
        let oct = document.getElementById('nov').value
        let nov = document.getElementById('dec').value
        let dec = document.getElementById('dec').value

        let Jan = document.getElementById('Jan').value
        let Feb = document.getElementById('Feb').value
        let Mar = document.getElementById('Mar').value
        let Apr = document.getElementById('Apr').value
        let May = document.getElementById('May').value
        let Jun = document.getElementById('Jun').value
        let Jul = document.getElementById('Jul').value
        let Aug = document.getElementById('Aug').value
        let Sep = document.getElementById('Sep').value
        let Oct = document.getElementById('Oct').value
        let Nov = document.getElementById('Nov').value
        let Dec = document.getElementById('Dec').value

        let year2023 = document.getElementById('year2023').value;
        let year2024 = document.getElementById('year2024').value;
        let year2025 = document.getElementById('year2025').value;
        let year2026 = document.getElementById('year2026').value;
        let year2027 = document.getElementById('year2027').value;
        let year2028 = document.getElementById('year2028').value;


        let users2023 = document.getElementById('users2023').value;
        let users2024 = document.getElementById('users2024').value;
        let users2025 = document.getElementById('users2025').value;
        let users2026 = document.getElementById('users2026').value;
        let users2027 = document.getElementById('users2027').value;
        let users2028 = document.getElementById('users2028').value;

        console.log('year2023', year2023);

        // Initial data for the chart
        var initialData1 = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Sales',
                tension: 0.3,
                fill: true,
                backgroundColor: 'rgba(44, 120, 220, 0.2)',
                borderColor: 'rgba(44, 120, 220)',
                data: [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
            },
            {
                label: 'Users',
                tension: 0.3,
                fill: true,
                backgroundColor: 'rgba(4, 209, 130, 0.2)',
                borderColor: 'rgb(4, 209, 130)',
                data: [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]
            },]
        };

        var chartOptions1 = {
            plugins: {
                legend: {
                    labels: {
                        usePointStyle: true,
                    },
                }
            }
        };

        var chart1 = new Chart(ctx1, {
            type: 'line',
            data: initialData1,
            options: chartOptions1
        });

        // Monthly and yearly data
        var monthlyData = [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec];
        var yearlyData = [year2023, year2024, year2025, year2026, year2027, year2028];


        var monthlyUserData = [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec];
        var yearlyUserData = [users2023, users2024, users2025, users2026, users2027, users2028];

        $('.toggle-chart').on('click', function () {
            var chartType = $(this).data('chart-type');
            var labels1 = chartType === 'monthly' ?
                ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] :
                Array.from({ length: 2028 - 2023 + 1 }, (_, i) => (2023 + i).toString());


            // Update data based on chart type
            var newData = chartType === 'monthly' ? monthlyData : yearlyData;
            var newUserData = chartType === 'monthly' ? monthlyUserData : yearlyUserData;
            // Update dataset values
            chart1.data.datasets[0].data = newData;
            chart1.data.datasets[1].data = newUserData;

            // Update labels for the dataset
            chart1.data.labels = labels1;

            // Update the chart
            chart1.update();
        });
    }


    document.addEventListener('DOMContentLoaded', function () {
        let profit2023 = document.getElementById('profit2023').value;
        let profit2024 = document.getElementById('profit2024').value;
        let profit2025 = document.getElementById('profit2025').value;
        let profit2026 = document.getElementById('profit2026').value;
        let profit2027 = document.getElementById('profit2027').value;
        let profit2028 = document.getElementById('profit2028').value;

        console.log('pro2023', profit2023);




        /*Sale statistics Chart*/
        if ($('#myChart2').length) {





            var ctx = document.getElementById("myChart2");
            var myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ["2023", "2024", "2025", "2026", "2027", "2028"],
                    datasets: [
                        {
                            label: "Yearly Profit",
                            backgroundColor: "#5897fb",
                            barThickness: 20,
                            data: [profit2023, profit2024, profit2025, profit2026, profit2027, profit2028]
                        },

                    ]
                },
                options: {
                    plugins: {
                        legend: {
                            labels: {
                                usePointStyle: true,
                            },
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        } //end if

    })

})(jQuery);