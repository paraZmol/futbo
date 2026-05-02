<?php

use Illuminate\Support\Facades\Route;

// Todas las rutas web sirven la SPA React — el router del frontend maneja la navegación
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
