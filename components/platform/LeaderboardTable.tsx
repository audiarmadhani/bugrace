import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { DailyLeaderboardEntry } from '@/services/leaderboard-service';

export function LeaderboardTable({
  entries,
  highlightUserId,
}: {
  entries: DailyLeaderboardEntry[];
  highlightUserId?: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No submissions yet. Be the first!
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Tester</TableHead>
          <TableHead className="text-right">Score</TableHead>
          <TableHead className="text-right">Submitted</TableHead>
          <TableHead className="text-right">F1 Pts</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow
            key={entry.userId}
            className={entry.userId === highlightUserId ? 'bg-accent/50' : ''}
          >
            <TableCell>
              <Badge variant={entry.rank <= 3 ? 'default' : 'secondary'}>
                P{entry.rank}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{entry.username}</TableCell>
            <TableCell className="text-right">{entry.accuracyScore}/25</TableCell>
            <TableCell className="text-right text-xs text-muted-foreground font-mono">
              {format(new Date(entry.submittedAt), 'HH:mm')} UTC
            </TableCell>
            <TableCell className="text-right font-mono">{entry.f1Points}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
