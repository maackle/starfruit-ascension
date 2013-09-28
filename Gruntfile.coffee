module.exports = (grunt) ->


    # Project configuration.
    grunt.initConfig
        pkg: grunt.file.readJSON('package.json')

        config:
            app: '.'
            dist: '.'

        connect:
            server:
                options:
                    port: 1337
                    base: '<%= config.dist %>'

        watch:
            coffee:
                files: ["<%= config.app %>/coffee/{,**}/*.coffee"]
                tasks: ['coffee']
            # compass:
            #     files: ["<%= config.app %>/sass/{,**}/*.{sass,scss}"]
            #     tasks: ['compass']

        coffee:
            options:
                join: true
            compile:
                files:
                    "<%= config.dist %>/starstalk.js": [
                        "<%= config.app %>/coffee/util.coffee",
                        "<%= config.app %>/coffee/game.coffee",
                    ] # // compile and concat into single file

        compass:
            dist:
                options:
                    sassDir: "<%= config.app %>/sass/",
                    cssDir: "<%= config.dist %>/assets/styles/",
                    environment: 'production'

    grunt.loadNpmTasks('grunt-contrib-coffee')
    grunt.loadNpmTasks('grunt-contrib-copy')
    grunt.loadNpmTasks('grunt-contrib-watch')
    grunt.loadNpmTasks('grunt-contrib-compass')
    grunt.loadNpmTasks('grunt-contrib-jade')
    grunt.loadNpmTasks('grunt-contrib-connect')
    grunt.loadNpmTasks('grunt-notify')

    #// Default task(s).
    grunt.registerTask 'default', [
        'build'
        'connect'
        'watch'
    ]

    grunt.registerTask 'build', [
        # 'jade:dist'
        # 'compass:dist'
        'coffee:compile'
    ]