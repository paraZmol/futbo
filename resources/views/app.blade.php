<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0F2D4A" />
    <link rel="manifest" href="/manifest.json" />
    <title>CanchasApp</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    @if(app()->environment('local') && file_exists(public_path('hot')))
        @viteReactRefresh
        @vite(['resources/js/app/main.tsx'])
    @else
        {{-- Production/testing: use precompiled bundle from public/build/ --}}
        @php
            $manifest = json_decode(file_get_contents(public_path('build/manifest.json')), true);
            $entry = $manifest['resources/js/app/main.tsx'] ?? null;
        @endphp
        @if($entry)
            @if(isset($entry['css']))
                @foreach($entry['css'] as $css)
                    <link rel="stylesheet" href="/build/{{ $css }}" />
                @endforeach
            @endif
            <script type="module" src="/build/{{ $entry['file'] }}"></script>
        @endif
    @endif
</head>
<body class="antialiased">
    <div id="root"></div>
</body>
</html>
