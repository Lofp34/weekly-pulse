'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { getAllAuditsWithReps } from '../actions';

export default function Dashboard() {
    const [audits, setAudits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAudits();
    }, []);

    const loadAudits = async () => {
        try {
            const result = await getAllAuditsWithReps();
            const localAudits = JSON.parse(localStorage.getItem('sales_pulse_audits') || '[]');

            if (result.success && result.data && result.data.length > 0) {
                // If DB has data, use it (could merge, but let's prefer DB)
                setAudits(result.data);
            } else {
                // Fallback to local data
                setAudits(localAudits.reverse());
            }
        } catch (error) {
            console.error('Failed to load audits', error);
            // Fallback to local data on error
            const localAudits = JSON.parse(localStorage.getItem('sales_pulse_audits') || '[]');
            setAudits(localAudits.reverse());
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 50) return 'text-amber-400';
        return 'text-red-400';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Tableau de Bord</h1>
                        <p className="text-slate-300">Suivi de la performance commerciale</p>
                    </div>
                    <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Retour à l'audit
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-white text-sm font-medium">Audits Réalisés</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-white">{audits.length}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-white text-sm font-medium">Moyenne Équipe</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-white">
                                {audits.length > 0
                                    ? Math.round(audits.reduce((acc, curr) => acc + curr.totalScore, 0) / audits.length)
                                    : 0}
                                <span className="text-sm font-normal text-slate-400 ml-2">/ 100</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-white text-sm font-medium">Meilleur Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-400">
                                {audits.length > 0
                                    ? Math.max(...audits.map((a) => a.totalScore))
                                    : 0}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                    <CardHeader>
                        <CardTitle className="text-white">Historique des Audits</CardTitle>
                        <CardDescription className="text-slate-300">
                            Les 50 derniers audits réalisés
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8 text-slate-400">Chargement...</div>
                        ) : audits.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">Aucun audit trouvé</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10 hover:bg-white/5">
                                        <TableHead className="text-slate-300">Date</TableHead>
                                        <TableHead className="text-slate-300">Commercial</TableHead>
                                        <TableHead className="text-slate-300">Manager</TableHead>
                                        <TableHead className="text-right text-slate-300">Score</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {audits.map((audit) => (
                                        <TableRow key={audit.id} className="border-white/10 hover:bg-white/5">
                                            <TableCell className="text-white font-medium">
                                                {formatDate(audit.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-white">{audit.salesRepName}</TableCell>
                                            <TableCell className="text-slate-400">{audit.managerEmail}</TableCell>
                                            <TableCell className={`text-right font-bold ${getScoreColor(audit.totalScore)}`}>
                                                {audit.totalScore}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
