import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminStatsService } from './admin-stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-role.enum';

@Controller('admin/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminStatsController {
    constructor(private readonly statsService: AdminStatsService) { }

    @Get('dashboard')
    async getDashboardStats() {
        return this.statsService.getDashboardStats();
    }

    @Get('system-logs-ui')
    async getSystemLogsUI() {
        const { logs, filename, error } = await this.statsService.getSystemLogs(200);

        // Sanitize HTML to prevent XSS from log messages
        const esc = (s: string) => String(s || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        const rows = logs.map((log: any) => `
            <tr class="${esc(log.level)}">
                <td>${esc(log.timestamp)}</td>
                <td><span class="badge ${esc(log.level)}">${esc(log.level).toUpperCase()}</span></td>
                <td>${esc(log.context) || '-'}</td>
                <td>${esc(log.message)}</td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>System Logs - ${filename || 'Error'}</title>
                <style>
                    body { background: #050a06; color: #fff; font-family: monospace; padding: 20px; }
                    h1 { color: #00ff66; border-bottom: 1px solid #1a331e; padding-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #1a331e; font-size: 14px; }
                    th { color: #888; text-transform: uppercase; font-size: 12px; }
                    tr:hover { background: #0a140c; }
                    .badge { padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; }
                    .badge.info { background: #1a331e; color: #00ff66; }
                    .badge.error { background: #331a1a; color: #ff4d4d; }
                    .badge.warn { background: #332b1a; color: #ffcc00; }
                    .error { color: #ffcccc; }
                </style>
                <meta http-equiv="refresh" content="30">
            </head>
            <body>
                <h1>System Logs (${filename || error})</h1>
                <p>Most recent 200 entries. Auto-refreshes every 30s.</p>
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Level</th>
                            <th>Context</th>
                            <th>Message</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </body>
            </html>
        `;
    }
}
