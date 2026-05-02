<?php

declare(strict_types=1);

namespace App\Infrastructure\Http\Controllers;

use App\Infrastructure\Persistence\Eloquent\Models\UserModel;
use App\Infrastructure\Persistence\Eloquent\Models\VenueModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final readonly class AdminController
{
    public function partners(Request $request): JsonResponse
    {
        $status = $request->query('status');

        $query = UserModel::where('role', 'partner');
        if ($status) {
            $query->where('status', $status);
        }

        $partners = $query->get()->map(fn(UserModel $u) => [
            'id'         => $u->id,
            'name'       => $u->getAttribute('name'),
            'email'      => $u->getAttribute('email'),
            'status'     => $u->getAttribute('status'),
            'createdAt'  => $u->getAttribute('created_at'),
            'venueCount' => VenueModel::where('partner_id', $u->id)->count(),
        ]);

        return response()->json(['data' => $partners]);
    }

    public function approvePartner(int $userId): JsonResponse
    {
        UserModel::where('id', $userId)->update(['status' => 'active']);
        VenueModel::where('partner_id', $userId)->where('status', 'pending')->update(['status' => 'active']);

        DB::table('audit_logs')->insert([
            'user_id'      => auth()->id(),
            'action'       => 'partner.approved',
            'subject_type' => 'User',
            'subject_id'   => $userId,
            'before'       => json_encode(['status' => 'pending']),
            'after'        => json_encode(['status' => 'active']),
            'ip_address'   => request()->ip(),
            'created_at'   => now(),
        ]);

        return response()->json(['data' => ['approved' => true]]);
    }

    public function suspendPartner(int $userId): JsonResponse
    {
        UserModel::where('id', $userId)->update(['status' => 'suspended']);
        VenueModel::where('partner_id', $userId)->update(['status' => 'suspended']);

        DB::table('audit_logs')->insert([
            'user_id'      => auth()->id(),
            'action'       => 'partner.suspended',
            'subject_type' => 'User',
            'subject_id'   => $userId,
            'before'       => json_encode(['status' => 'active']),
            'after'        => json_encode(['status' => 'suspended']),
            'ip_address'   => request()->ip(),
            'created_at'   => now(),
        ]);

        return response()->json(['data' => ['suspended' => true]]);
    }

    public function auditLogs(Request $request): JsonResponse
    {
        $entityType = $request->query('entity_type');
        $dateFrom   = $request->query('date_from');
        $dateTo     = $request->query('date_to');
        $page       = max(1, (int) $request->query('page', 1));
        $perPage    = 20;

        $query = DB::table('audit_logs')->orderByDesc('created_at');

        if ($entityType) {
            $query->where('subject_type', $entityType);
        }
        if ($dateFrom) {
            $query->where('created_at', '>=', $dateFrom . ' 00:00:00');
        }
        if ($dateTo) {
            $query->where('created_at', '<=', $dateTo . ' 23:59:59');
        }

        $total = $query->count();
        $logs  = $query->skip(($page - 1) * $perPage)->take($perPage)->get();

        return response()->json([
            'data' => $logs->map(fn($l) => [
                'id'          => $l->id,
                'userId'      => $l->user_id,
                'action'      => $l->action,
                'subjectType' => $l->subject_type,
                'subjectId'   => $l->subject_id,
                'createdAt'   => $l->created_at,
                'ipAddress'   => $l->ip_address,
            ]),
            'meta' => [
                'page'       => $page,
                'perPage'    => $perPage,
                'total'      => $total,
                'totalPages' => (int) ceil($total / $perPage),
            ],
        ]);
    }
}
